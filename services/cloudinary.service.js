const cloudinary = require("../config/cloudinary_config");
const { Readable } = require("stream");

const ApiError = require("../utils/apiError");

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(
              500,
              `Failed to upload image to Cloudinary ${error.message}`,
            ),
          );
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (public_id) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) {
        return reject(
          new ApiError(
            500,
            `Failed to delete image from Cloudinary ${error.message}`,
          ),
        );
      }
      resolve(result);
    });
  });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
