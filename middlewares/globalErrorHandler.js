const httpStatusText = require("../utils/httpStatusText");

module.exports = (err, req, res, next) => {
  console.log(err);
  const statusCode = err.statusCode || 500;
  const status = err.status || httpStatusText.ERROR;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ status: status, message: message });
};
