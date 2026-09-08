const upload = require("./upload");
const handleUploadError = require("./handleUploadError");

const uploadMultiple = (fieldName, maxCount, required = false) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      const uploadError = handleUploadError(err, fieldName, maxCount);

      if (uploadError) {
        req.uploadError = uploadError;
      }

      if (
        required &&
        (!req.files || req.files.length === 0) &&
        !req.uploadError
      ) {
        req.uploadError = {
          message: `At least one '${fieldName}' file is required.`,
        };
      }

      next();
    });
  };
};

module.exports = uploadMultiple;
