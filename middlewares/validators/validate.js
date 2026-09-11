const { validationResult } = require("express-validator");
const ApiError = require("../../utils/apiError");

const validate = (req, res, next) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);

  const validationErrors = errors.isEmpty() ? [] : errors.array();

  const uploadErrors = req.uploadError ? [req.uploadError.message] : [];

  const allErrors =
    validationErrors.length > 0 ? validationErrors : uploadErrors;

  if (allErrors.length > 0) {
    return next(new ApiError(400, allErrors.join(", ")));
  }

  next();
};

module.exports = validate;
