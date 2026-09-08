const multer = require("multer");
const ApiError = require("../../utils/apiError");

const MAX_FILE_SIZE = parseInt(process.env.MAX_Image_SIZE) || 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image files are allowed!"), false);
    }

    cb(null, true);
  },

  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = upload;
