const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UsersModel = require("../models/users.model");
const OtpModel = require("../models/otp.model");
const ResetTokenModel = require("../models/resetToken.model");
const RefreshTokenModel = require("../models/refreshToken.model");

const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");
const {
  handleAdminRoleTransition,
  handleSuperAdminRoleTransition,
} = require("../utils/roleTransitions");

const { uploadToCloudinary } = require("../services/cloudinary.service");

const sendEmail = require("../services/sendEmail");
const emailVerificationTemplate = require("../templates/emails/verificationEmailTemplate");
const resetPasswordTemplate = require("../templates/emails/resetPasswordTemplate");

const login = asyncWrapper(async (req, res, next) => {
  if (req.cookies && req.cookies.refreshToken) {
    return next(
      new ApiError(
        400,
        "You are already logged in. Please log out before logging in again.",
      ),
    );
  }

  const { email, password } = req.body;

  const user = await UsersModel.credentials(email, password);

  const accessToken = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );

  await RefreshTokenModel.create({
    token: refreshToken,
    user: user._id,
  });

  res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      status: httpStatusText.SUCCESS,
      message: "Logged in successfully",
      data: { user, accessToken },
    });
});

const register = asyncWrapper(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  let user = new UsersModel({
    name,
    phone,
    email,
    password,
  });

  if (req.file) {
    const { secure_url, public_id } = await uploadToCloudinary(
      req.file.buffer,
      "users/profile-images",
    );
    user.image = { image_url: secure_url, public_id };
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      user = await user.save({ session });

      const otpDoc = new OtpModel({
        otp: bcrypt.hashSync(otp, 10),
        purpose: "email-verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        user: user._id,
      });
      await otpDoc.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await sendEmail(
    email,
    "Verify your email",
    emailVerificationTemplate({
      name:
        user.name.split(" ").length > 2
          ? user.name.split(" ").slice(0, 2).join(" ")
          : user.name,
      otp,
    }),
  );

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "User account created successfully",
    data: { user },
  });
});

const changeRole = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await UsersModel.findById(id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  const isSuperAdmin = user.role === "super-admin";
  const isAdmin = user.role === "admin";
  const isOwner = req.user._id.toString() === id;

  if (isSuperAdmin && !isOwner) {
    return next(
      new ApiError(
        403,
        "User cannot change the role of another super-admin user",
      ),
    );
  }

  if (req.user.role !== "super-admin" && isAdmin) {
    if (isOwner && role === "super-admin") {
      return next(
        new ApiError(
          403,
          "User cannot promote themselves to super-admin. Please contact another super-admin to change your role.",
        ),
      );
    } else if (!isOwner) {
      return next(
        new ApiError(403, "User cannot change the role of another admin user"),
      );
    }
  }

  if (user.role === role) {
    return next(new ApiError(400, `User already has the role of ${role}`));
  }

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      if (isSuperAdmin && role !== "super-admin") {
        await handleSuperAdminRoleTransition(session, "change", role);
      }

      if (isAdmin && role === "user") {
        await handleAdminRoleTransition(session, "change");
      }

      user.role = role;
      await user.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User role updated successfully",
    data: { user },
  });
});

const sendPasswordResetOTP = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  const user = await UsersModel.findOne({ email });

  if (!user) {
    return next(new ApiError(404, "User not found with the provided email"));
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await OtpModel.deleteMany({
    user: user._id,
    purpose: "password-reset",
  });

  const otpDocument = new OtpModel({
    purpose: "password-reset",
    otp: bcrypt.hashSync(otp, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    user: user._id,
  });

  await otpDocument.save();

  await sendEmail(
    email,
    "Reset your password",
    resetPasswordTemplate({
      name:
        user.name.length > 2
          ? user.name.split(" ").slice(0, 2).join(" ")
          : user.name,
      otp,
    }),
  );

  res
    .status(200)
    .cookie("email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    })
    .json({
      status: httpStatusText.SUCCESS,
      message: "Password reset OTP sent successfully",
    });
});

const verifyPasswordResetOTP = asyncWrapper(async (req, res, next) => {
  const { otp } = req.body;

  const email = req.cookies.email;

  if (!email) {
    return next(new ApiError(400, "No email found in cookies"));
  }

  const user = await UsersModel.findOne({ email });

  if (!user) {
    return next(new ApiError(404, "User not found with the provided email"));
  }

  const otpRecord = await OtpModel.findOne({
    user: user._id,
    purpose: "password-reset",
  });

  if (!otpRecord) {
    return next(new ApiError(400, "Invalid or expired OTP"));
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpModel.deleteOne({ _id: otpRecord._id });
    return next(new ApiError(400, "Invalid or expired OTP"));
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);

  if (!isMatch) {
    return next(new ApiError(400, "Invalid OTP"));
  }

  const resetToken = await bcrypt.hash(
    crypto.randomBytes(32).toString("hex"),
    10,
  );

  await ResetTokenModel.deleteMany({
    user: user._id,
    purpose: "password-reset",
  });

  const resetTokenDocument = new ResetTokenModel({
    purpose: "password-reset",
    token: resetToken,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    user: user._id,
  });

  await resetTokenDocument.save();

  await OtpModel.deleteOne({ _id: otpRecord._id });

  await res
    .status(200)
    .clearCookie("email")
    .cookie("passwordResetToken", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    })
    .json({
      status: httpStatusText.SUCCESS,
      message: "OTP verified successfully",
    });
});

const resetUserPassword = asyncWrapper(async (req, res, next) => {
  const { newPassword } = req.body;

  const resetToken = req.cookies.passwordResetToken;

  if (!resetToken) {
    return next(new ApiError(400, "No password reset token provided"));
  }

  const resetTokenRecord = await ResetTokenModel.findOne({
    token: resetToken,
    purpose: "password-reset",
  });

  if (!resetTokenRecord) {
    return next(new ApiError(400, "Invalid or expired password reset token"));
  }

  if (resetTokenRecord.expiresAt < new Date()) {
    await ResetTokenModel.deleteOne({ _id: resetTokenRecord._id });
    return next(new ApiError(400, "Invalid or expired password reset token"));
  }

  const user = await UsersModel.findById(resetTokenRecord.user);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      await user.save({ session });

      await RefreshTokenModel.deleteMany({ user: user._id }, { session });

      await ResetTokenModel.deleteOne(
        { _id: resetTokenRecord._id },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(200).clearCookie("passwordResetToken").json({
    status: httpStatusText.SUCCESS,
    message: "Password reset successfully",
  });
});

const changeUserPassword = asyncWrapper(async (req, res, next) => {
  const { newPassword } = req.body;

  await UsersModel.findByIdAndUpdate(
    req.user._id,
    { $set: { password: newPassword, passwordChangedAt: new Date() } },
    { new: true, runValidators: true },
  );

  await RefreshTokenModel.deleteMany({ user: req.user._id });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Password updated successfully",
  });
});

const transferRole = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const user = await UsersModel.findById(id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      if (req.user.role === "user" && user.role === "admin") {
        return next(
          new ApiError(400, "Admin can only transfer their role to a user"),
        );
      }

      if (
        (req.user.role === "admin" || req.user.role === "user") &&
        user.role === "super-admin"
      ) {
        return next(
          new ApiError(
            400,
            "Super-admin can only transfer their role to an admin or user",
          ),
        );
      }

      if (req.user.role === user.role) {
        return next(
          new ApiError(
            400,
            "Cannot transfer role to a user with the same role",
          ),
        );
      }

      [req.user.role, user.role] = [user.role, req.user.role];

      req.user = await UsersModel.findByIdAndUpdate(
        req.user._id,
        {
          $set: { role: req.user.role },
        },
        { new: true, runValidators: true },
      ).session(session);

      await user.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User role transferred successfully",
    data: { user: req.user },
  });
});

const verifyEmail = asyncWrapper(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await UsersModel.findOne({ email });

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  if (user.isEmailVerified) {
    return next(new ApiError(400, "Email is already verified"));
  }

  const otpRecord = await OtpModel.findOne({
    user: user._id.toString(),
    purpose: "email-verification",
  });

  if (!otpRecord) {
    return next(new ApiError(400, "Verification OTP not found or has expired"));
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpModel.deleteOne({ _id: otpRecord._id });

    return next(new ApiError(400, "Verification OTP has expired"));
  }

  const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);

  if (!isValidOTP) {
    return next(new ApiError(400, "Invalid verification OTP"));
  }

  user.isEmailVerified = true;

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      await user.save({ session });

      await OtpModel.deleteOne({
        _id: otpRecord._id,
      }).session(session);
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Email verified successfully",
    data: { user },
  });
});

const resendVerificationEmail = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await UsersModel.findOne({ email });

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  if (user.isEmailVerified) {
    return next(new ApiError(400, "Email is already verified"));
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      await OtpModel.deleteMany(
        {
          user: user._id,
          purpose: "email-verification",
        },
        { session },
      );

      const otpDocument = new OtpModel({
        purpose: "email-verification",
        otp: bcrypt.hashSync(otp, 10),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        user: user._id.toString(),
      });

      await otpDocument.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await sendEmail(
    email,
    "Verify your email",
    emailVerificationTemplate({
      name:
        user.name.split(" ").length > 2
          ? user.name.split(" ").slice(0, 2).join(" ")
          : user.name,
      otp,
    }),
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Verification email sent successfully",
  });
});

const logout = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(
      new ApiError(400, "You are not logged in or already logged out"),
    );
  }

  const decoded = await jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
  );

  const user = await UsersModel.findById(decoded.id);

  if (!user) {
    return next(new ApiError(400, "Invalid or expired refresh token"));
  }

  if (
    !(await RefreshTokenModel.findOne({ token: refreshToken, user: user._id }))
  ) {
    return next(new ApiError(400, "you are already logged out"));
  }

  await RefreshTokenModel.deleteOne({ token: refreshToken, user: user._id });

  res.status(200).clearCookie("refreshToken").json({
    status: httpStatusText.SUCCESS,
    message: "Logged out successfully",
  });
});

const refreshToken = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(
      new ApiError(401, "Authorization failed. No refresh token provided."),
    );
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await UsersModel.findById(decoded.id).select(
    "+passwordChangedAt",
  );

  if (
    !user ||
    !(await RefreshTokenModel.findOne({ token: refreshToken, user: user._id }))
  ) {
    return next(
      new ApiError(401, "Authorization failed. Invalid refresh token."),
    );
  }

  if (
    user.passwordChangedAt &&
    user.passwordChangedAt > new Date(decoded.iat * 1000)
  ) {
    return next(
      new ApiError(
        401,
        "Authorization failed. Password has been changed. Please log in again.",
      ),
    );
  }

  await RefreshTokenModel.deleteOne({ token: refreshToken, user: user._id });

  const accessToken = jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
  );

  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );

  await RefreshTokenModel.create({
    token: newRefreshToken,
    user: user._id,
  });

  res
    .status(200)
    .cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      status: httpStatusText.SUCCESS,
      message: "Refresh and access tokens are generated successfully",
      data: { accessToken },
    });
});

module.exports = {
  login,
  register,
  changeRole,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetUserPassword,
  changeUserPassword,
  transferRole,
  logout,
  refreshToken,
  verifyEmail,
  resendVerificationEmail,
};
