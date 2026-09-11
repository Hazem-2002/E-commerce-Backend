const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const UsersModel = require("../models/users.model");
const RefreshTokenModel = require("../models/refreshToken.model");
const ResetTokenModel = require("../models/resetToken.model");
const OtpModel = require("../models/otp.model");
const ApiError = require("../utils/apiError");
const sendEmail = require("./sendEmail.service");
const emailVerificationTemplate = require("../templates/emails/verificationEmailTemplate");
const resetPasswordTemplate = require("../templates/emails/resetPasswordTemplate");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service");

const {
  handleAdminRoleTransition,
  handleSuperAdminRoleTransition,
} = require("../utils/roleTransitions");

const loginService = async (email, password) => {
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

  return { user, accessToken, refreshToken };
};

const logoutService = async (refreshToken) => {
  const decoded = await jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
  );

  const user = await UsersModel.findById(decoded.id);

  if (
    !user ||
    !(await RefreshTokenModel.findOne({ token: refreshToken, user: user._id }))
  ) {
    return next(
      new ApiError(400, "Invalid refresh token. You are already logged out."),
    );
  }

  await RefreshTokenModel.deleteOne({ token: refreshToken, user: user._id });
};

const registerService = async ({ name, phone, email, password, file }) => {
  let user = new UsersModel({
    name,
    phone,
    email,
    password,
  });

  if (file) {
    const { secure_url, public_id } = await uploadToCloudinary(
      file.buffer,
      "users/profile-images",
    );
    user.image = { image_url: secure_url, public_id };
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      const otpDoc = new OtpModel({
        otp: await bcrypt.hash(otp, 10),
        purpose: "email-verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        user: user._id,
      });

      await otpDoc.save({ session });
      user = await user.save({ session });
    });
  } catch (error) {
    if (
      file &&
      user.image?.public_id &&
      user.image?.public_id !== "users/profile-images/uvjrevfifa7lvkpn3o3k"
    ) {
      await deleteFromCloudinary(user.image.public_id);
    }
    throw error;
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

  return user;
};

const changeRoleService = async ({ userId, newRole, currentUser }) => {
  const user = await UsersModel.findById(userId);

  if (!user) {
    throw new ApiError(404, "No user found with the provided ID.");
  }

  const isSuperAdmin = user.role === "super-admin";
  const isAdmin = user.role === "admin";
  const isOwner = currentUser._id.toString() === userId.toString();

  if (isSuperAdmin && !isOwner) {
    throw new ApiError(
      403,
      "You cannot change the role of another super-admin user. Please contact another super-admin to change the role.",
    );
  }

  if (currentUser.role !== "super-admin" && isAdmin) {
    if (isOwner && newRole === "super-admin") {
      throw new ApiError(
        403,
        "You cannot promote yourself to super-admin. Please contact another super-admin to change your role.",
      );
    } else if (!isOwner) {
      throw new ApiError(
        403,
        "You cannot change the role of another admin user. Please contact another super-admin to change the role.",
      );
    }
  }

  if (currentUser.role !== "super-admin" && newRole === "super-admin") {
    throw new ApiError(
      403,
      "You cannot promote another user to super-admin. Please contact another super-admin to change the role.",
    );
  }

  if (user.role === newRole && !isOwner) {
    throw new ApiError(400, `The user already has the role '${newRole}'.`);
  }

  if (user.role === newRole && isOwner) {
    throw new ApiError(400, `You already have the role '${newRole}'.`);
  }

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      if (isSuperAdmin && newRole !== "super-admin") {
        await handleSuperAdminRoleTransition(session, "change", newRole);
      }

      if (isAdmin && newRole === "user") {
        await handleAdminRoleTransition(session, "change");
      }

      user.role = newRole;
      await user.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return user;
};

const transferRoleService = async ({ userId, currentUser }) => {
  const user = await UsersModel.findById(userId);

  if (!user) {
    throw new ApiError(404, "No user found with the provided ID.");
  }

  let userAfterTransfer = null;

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      if (currentUser.role === "user" && user.role === "admin") {
        throw new ApiError(
          400,
          "Admin can only transfer their role to a user.",
        );
      }

      if (
        (currentUser.role === "admin" || currentUser.role === "user") &&
        user.role === "super-admin"
      ) {
        throw new ApiError(
          400,
          "Super-admin can only transfer their role to an admin or user.",
        );
      }

      if (currentUser.role === user.role) {
        throw new ApiError(
          400,
          "You cannot transfer your role to a user with the same role.",
        );
      }

      [currentUser.role, user.role] = [user.role, currentUser.role];

      userAfterTransfer = await UsersModel.findByIdAndUpdate(
        currentUser._id,
        {
          $set: { role: currentUser.role },
        },
        { new: true, runValidators: true },
      ).session(session);

      await user.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return userAfterTransfer;
};

const sendPasswordResetOTPService = async (email) => {
  const user = await UsersModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No user found with the provided email address");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await OtpModel.deleteMany({
    user: user._id,
    purpose: "password-reset",
  });

  const otpDocument = new OtpModel({
    purpose: "password-reset",
    otp: await bcrypt.hash(otp, 10),
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
};

const verifyPasswordResetOTPService = async ({ email, otp }) => {
  const user = await UsersModel.findOne({ email });

  if (!user) {
    throw new ApiError(
      404,
      "No user found with the provided email address. Please request a new OTP.",
    );
  }

  const otpRecord = await OtpModel.findOne({
    user: user._id,
    purpose: "password-reset",
  });

  if (!otpRecord) {
    throw new ApiError(
      400,
      "Invalid or expired OTP, please request a new one.",
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpModel.deleteOne({ _id: otpRecord._id });

    throw new ApiError(400, "OTP has expired, please request a new one.");
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);

  if (!isMatch) {
    throw new ApiError(400, "Invalid OTP, please try again.");
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

  return resetToken;
};

const resetUserPasswordService = async ({ resetToken, newPassword }) => {
  const resetTokenRecord = await ResetTokenModel.findOne({
    token: resetToken,
    purpose: "password-reset",
  });

  if (!resetTokenRecord) {
    throw new ApiError(
      400,
      "Invalid or expired password reset token. Please request a new OTP.",
    );
  }

  if (resetTokenRecord.expiresAt < new Date()) {
    await ResetTokenModel.deleteOne({ _id: resetTokenRecord._id });

    throw new ApiError(
      400,
      "Password reset token has expired. Please request a new OTP.",
    );
  }

  const user = await UsersModel.findById(resetTokenRecord.user);

  if (!user) {
    throw new ApiError(
      404,
      "No user found for the provided password reset token.",
    );
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
};

const changeUserPasswordService = async ({ userId, newPassword }) => {
  await UsersModel.findByIdAndUpdate(
    userId,
    { $set: { password: newPassword, passwordChangedAt: new Date() } },
    { new: true, runValidators: true },
  );

  await RefreshTokenModel.deleteMany({ user: userId });
};

const verifyEmailService = async ({ email, otp }) => {
  const user = await UsersModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No user found with the provided email address.");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified.");
  }

  const otpRecord = await OtpModel.findOne({
    user: user._id.toString(),
    purpose: "email-verification",
  });

  if (!otpRecord) {
    throw new ApiError(
      400,
      "Invalid or expired verification OTP. Please request a new one.",
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpModel.deleteOne({ _id: otpRecord._id });

    throw new ApiError(
      400,
      "Verification OTP has expired. Please request a new one.",
    );
  }

  const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);

  if (!isValidOTP) {
    throw new ApiError(400, "Invalid verification OTP. Please try again.");
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

  return user;
};

const resendVerificationEmailService = async (email) => {
  const user = await UsersModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No user found with the provided email address.");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified.");
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
        otp: await bcrypt.hash(otp, 10),
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
};

const refreshTokenService = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await UsersModel.findById(decoded.id).select(
    "+passwordChangedAt",
  );

  if (
    !user ||
    !(await RefreshTokenModel.findOne({ token: refreshToken, user: user._id }))
  ) {
    throw new ApiError(401, "Authorization failed. Invalid refresh token.");
  }

  if (
    user.passwordChangedAt &&
    user.passwordChangedAt > new Date(decoded.iat * 1000)
  ) {
    throw new ApiError(
      401,
      "Authorization failed. Password has been changed. Please log in again.",
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

  return { accessToken, newRefreshToken };
};

module.exports = {
  loginService,
  logoutService,
  registerService,
  changeRoleService,
  transferRoleService,
  sendPasswordResetOTPService,
  verifyPasswordResetOTPService,
  resetUserPasswordService,
  changeUserPasswordService,
  verifyEmailService,
  resendVerificationEmailService,
  refreshTokenService,
};
