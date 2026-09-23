const ApiError = require("../utils/apiError");

const parseJsonFields = (...fields) => {
  return (req, res, next) => {
    try {
      for (const field of fields) {
        if (req.body[field]) {
          req.body[field] = JSON.parse(req.body[field]);
        }
      }

      next();
    } catch (error) {
      return next(new ApiError(400, "Invalid JSON format"));
    }
  };
};

module.exports = parseJsonFields;
