const multer = require("multer");
const formatFileSize = require("../../utils/formatFileSize");

const handleUploadError = (err, fieldName, maxCount = 1) => {
  if (!err) return null;

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      if (err.field !== fieldName) {
        return {
          ...err,
          message: `Unexpected field name: '${err.field}'. Expected field name: '${fieldName}'.`,
        };
      }

      return {
        ...err,
        message: `Too many files. Maximum ${maxCount} file(s) are allowed for '${fieldName}'.`,
      };
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      const MAX_FILE_SIZE =
        parseInt(process.env.MAX_Image_SIZE) || 10 * 1024 * 1024;

      return {
        ...err,
        message: `File size exceeds the maximum allowed size of ${formatFileSize(
          MAX_FILE_SIZE,
        )}.`,
      };
    }

    if (err.code === "MISSING_FIELD_NAME") {
      return {
        ...err,
        message: `Missing field name for file upload. Expected field name: '${fieldName}'.`,
      };
    }
  }

  return err;
};

module.exports = handleUploadError;
