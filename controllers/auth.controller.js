const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const {
  loginService,
  logoutService,
  registerService,
  changeRoleService,
  transferRoleService,
  sendPasswordResetOTPService,
  verifyPasswordResetOTPService,
  resetUserPasswordService,
  changeUserPasswordService,
  resendVerificationEmailService,
  verifyEmailService,
  refreshTokenService,
} = require("../services/auth.service");

const register = asyncWrapper(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const user = await registerService({
    name,
    email,
    password,
    phone,
    file: req.file,
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "User account created successfully",
    data: { user },
  });
});

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

  const { user, accessToken, refreshToken } = await loginService(
    email,
    password,
  );

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

const logout = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(
      new ApiError(
        400,
        "No refresh token provided. You are already logged out.",
      ),
    );
  }

  await logoutService(refreshToken);

  res.status(200).clearCookie("refreshToken").json({
    status: httpStatusText.SUCCESS,
    message: "Logged out successfully",
  });
});

const changeRole = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await changeRoleService({
    userId: id,
    newRole: role,
    currentUser: req.user,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User role updated successfully",
    data: { user },
  });
});

const transferRole = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const user = await transferRoleService({
    userId: id,
    currentUser: req.user,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User role transferred successfully",
    data: { user },
  });
});

const sendPasswordResetOTP = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  await sendPasswordResetOTPService(email);

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
    return next(
      new ApiError(400, "No email found in cookies. Please request a new OTP."),
    );
  }

  const resetToken = await verifyPasswordResetOTPService({ email, otp });

  res
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
    return next(
      new ApiError(
        400,
        "No password reset token found. Please request a new OTP.",
      ),
    );
  }

  await resetUserPasswordService({ resetToken, newPassword });

  res
    .status(200)
    .clearCookie("passwordResetToken")
    .clearCookie("refreshToken")
    .json({
      status: httpStatusText.SUCCESS,
      message: "Password reset successfully",
    });
});

const changeUserPassword = asyncWrapper(async (req, res, next) => {
  const { newPassword } = req.body;

  await changeUserPasswordService({ userId: req.user._id, newPassword });

  res.status(200).clearCookie("refreshToken").json({
    status: httpStatusText.SUCCESS,
    message: "Password updated successfully",
  });
});

const resendVerificationEmail = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  await resendVerificationEmailService(email);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Verification email sent successfully",
  });
});

const verifyEmail = asyncWrapper(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await verifyEmailService({ email, otp });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Email verified successfully",
    data: { user },
  });
});

const refreshToken = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(
      new ApiError(401, "Authorization failed. No refresh token provided."),
    );
  }

  const { accessToken, newRefreshToken } =
    await refreshTokenService(refreshToken);

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
