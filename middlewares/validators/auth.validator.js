const ApiError = require("../../utils/apiError");

const usersModel = require("../../models/users.model");

const {
  nameRule,
  phoneRule,
  emailRule,
  passwordRule,
  currentPasswordRule,
  confirmPasswordRule,
  roleRule,
  otpRule,
  mongoIdRule,
} = require("./common/validationRules");

const registerValidator = [
  nameRule("name", "User name", 3, 50),
  phoneRule("phone", "User phone"),
  emailRule("email", "User email")
    .bail()
    .custom(async (value) => {
      const user = await usersModel.findOne({ email: value });
      if (user) {
        return Promise.reject(
          new ApiError(
            400,
            "Email already exists. Please choose a different email.",
          ),
        );
      }
    }),
  passwordRule("password", "User password"),
  confirmPasswordRule("confirmPassword", "password", "Confirm Password"),
];

const changeRoleValidator = [
  mongoIdRule("id", "User ID"),
  roleRule("role", "User role"),
];

const transferRoleValidator = [mongoIdRule("id", "User ID")];

const verifyEmailValidator = [
  emailRule("email", "User email"),
  otpRule("otp", "OTP"),
];

const resendVerificationEmailValidator = [emailRule("email", "User email")];

const changeUserPasswordValidator = [
  currentPasswordRule("currentPassword", "Current Password"),
  passwordRule("newPassword", "New Password")
    .bail()
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        return Promise.reject(
          new ApiError(
            400,
            "New password cannot be the same as the current password. Please choose a different password.",
          ),
        );
      }

      return true;
    }),
  confirmPasswordRule("confirmPassword", "newPassword"),
];

const forgotPasswordValidator = [emailRule("email", "User email")];

const verifyPasswordResetOTPValidator = [otpRule("otp", "OTP")];

const resetPasswordValidator = [
  passwordRule("newPassword", "New Password"),
  confirmPasswordRule("confirmPassword", "newPassword", "Confirm Password"),
];

module.exports = {
  registerValidator,
  changeRoleValidator,
  changeUserPasswordValidator,
  forgotPasswordValidator,
  verifyPasswordResetOTPValidator,
  resetPasswordValidator,
  transferRoleValidator,
  verifyEmailValidator,
  resendVerificationEmailValidator,
};
