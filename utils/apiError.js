const httpStatusText = require("./httpStatusText");

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4")
      ? httpStatusText.FAIL
      : httpStatusText.ERROR;
  }
}

module.exports = ApiError;
