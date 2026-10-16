const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const uploadSingle = require("../middlewares/upload/uploadSingle");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  login,
  register,
  changeRole,
  transferRole,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetUserPassword,
  changeUserPassword,
  logout,
  refreshToken,
  generateCsrfToken,
  verifyEmail,
  resendVerificationEmail,
} = require("../controllers/auth.controller");

const {
  registerValidator,
  changeRoleValidator,
  changeUserPasswordValidator,
  forgotPasswordValidator,
  verifyPasswordResetOTPValidator,
  resetPasswordValidator,
  transferRoleValidator,
  verifyEmailValidator,
  resendVerificationEmailValidator,
} = require("../middlewares/validators/auth.validator");

const validate = require("../middlewares/validators/validate");

const { doubleCsrfProtection } = require("../config/csrf");

const httpStatusText = require("../utils/httpStatusText");

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    status: httpStatusText.FAIL,
    message: "Too many requests from this IP, please try again later.",
  },
});

router.use(rateLimiter);

router.route("/login").post(login);

router
  .route("/register")
  .post(
    uploadSingle("profileImage", false),
    registerValidator,
    validate,
    register,
  );

router.route("/csrf-token").get(authenticate, generateCsrfToken);

router
  .route("/:id/change-role")
  .patch(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    changeRoleValidator,
    validate,
    changeRole,
  );

router
  .route("/:id/transfer-role")
  .post(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    transferRoleValidator,
    validate,
    transferRole,
  );

router
  .route("/password/forgot")
  .post(forgotPasswordValidator, validate, sendPasswordResetOTP);

router
  .route("/password/forgot/resend")
  .post(forgotPasswordValidator, validate, sendPasswordResetOTP);

router
  .route("/password/verify-otp")
  .post(verifyPasswordResetOTPValidator, validate, verifyPasswordResetOTP);

router
  .route("/password/reset")
  .post(resetPasswordValidator, validate, resetUserPassword);

router
  .route("/password/change")
  .patch(
    authenticate,
    doubleCsrfProtection,
    changeUserPasswordValidator,
    validate,
    changeUserPassword,
  );

router.route("/logout").post(logout);

router.route("/refresh-token").post(refreshToken);

router.route("/verify-email").post(verifyEmailValidator, validate, verifyEmail);

router
  .route("/resend-verification-email")
  .post(resendVerificationEmailValidator, validate, resendVerificationEmail);

module.exports = router;
