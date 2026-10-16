const { doubleCsrf } = require("csrf-csrf");

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,

  getSessionIdentifier: (req) => req.user._id,

  cookieName: "x-csrf-token",

  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },

  size: 64,
});

module.exports = {
  doubleCsrfProtection,
  generateCsrfToken,
};
