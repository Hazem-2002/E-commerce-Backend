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
  nameRule("User", 3, 50).bail({ level: "request" }),
  phoneRule().bail({ level: "request" }),
  emailRule()
    .bail()
    .custom(async (value) => {
      const user = await usersModel.findOne({ email: value });
      if (user) {
        return Promise.reject(new ApiError(400, "Email already exists"));
      }
    })
    .bail({ level: "request" }),
  passwordRule().bail({ level: "request" }),
  confirmPasswordRule().bail({ level: "request" }),
];

const changeRoleValidator = [
  mongoIdRule("id").bail({ level: "request" }),
  roleRule().bail({ level: "request" }),
];

const transferRoleValidator = [mongoIdRule("id").bail({ level: "request" })];

const verifyEmailValidator = [
  emailRule().bail({ level: "request" }),
  otpRule().bail({ level: "request" }),
];

const resendVerificationEmailValidator = [
  emailRule().bail({ level: "request" }),
];

const changeUserPasswordValidator = [
  currentPasswordRule("currentPassword").bail({ level: "request" }),
  passwordRule("newPassword")
    .bail()
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        return Promise.reject(
          new ApiError(
            400,
            "New password cannot be the same as the old password",
          ),
        );
      }

      return true;
    })
    .bail({ level: "request" }),
  confirmPasswordRule("confirmPassword", "newPassword").bail({
    level: "request",
  }),
];

const forgotPasswordValidator = [emailRule().bail({ level: "request" })];

const verifyPasswordResetOTPValidator = [otpRule().bail({ level: "request" })];

const resetPasswordValidator = [
  passwordRule("newPassword").bail({ level: "request" }),
  confirmPasswordRule("confirmPassword", "newPassword").bail({
    level: "request",
  }),
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
