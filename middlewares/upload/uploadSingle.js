const handleUploadError = require("./handleUploadError");
const upload = require("./upload");

const uploadSingle = (fieldName, required = false) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      const uploadError = handleUploadError(err, fieldName, 1);

      if (uploadError) {
        req.uploadError = uploadError;
      }

      if (required && !req.file && !req.uploadError) {
        req.uploadError = {
          message: `The '${fieldName}' file is required.`,
        };
      }

      next();
    });
  };
};

module.exports = uploadSingle;
