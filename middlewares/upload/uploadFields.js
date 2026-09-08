const upload = require("./upload");
const handleUploadError = require("./handleUploadError");

const uploadFields = (fields, required = false, filetype = "image") => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      let uploadError = null;

      const field = fields.find((field) =>
        field.name.toLowerCase().includes(err?.field?.toLowerCase()),
      );

      if (
        field &&
        (!req.files[field.name] ||
          (err?.code === "LIMIT_UNEXPECTED_FILE" && err?.field === field.name))
      ) {
        uploadError = handleUploadError(err, field.name, field.maxCount);
      } else {
        for (const field of fields) {
          if (
            !req.files[field.name] ||
            (err?.code === "LIMIT_UNEXPECTED_FILE" && err?.field === field.name)
          ) {
            uploadError = handleUploadError(err, field.name, field.maxCount);
            break;
          }
        }
      }

      if (uploadError) {
        req.uploadError = uploadError;
      }
      if (required && !req.uploadError && req.files) {
        const missingField = fields.find(
          (field) =>
            !req.files[field.name] || req.files[field.name].length === 0,
        );

        if (missingField) {
          req.uploadError = {
            message: `The '${missingField.name}' field is required.`,
          };
        }
      }

      next();
    });
  };
};

module.exports = uploadFields;
