const UserModel = require("../models/users.model");
const ReviewModel = require("../models/review.model");
const RefreshTokenModel = require("../models/refreshToken.model");

const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service");

const {
  handleSuperAdminRoleTransition,
  handleAdminRoleTransition,
} = require("../utils/roleTransitions");

const getUsersService = async (query) => {
  const apiFeatures = new ApiFeatures(UserModel.find(), query);

  apiFeatures
    .filter()
    .search()
    .paginate(await UserModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields();

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const users = await apiFeatures.query;

  return { users, paginatedResults: apiFeatures.paginatedResults };
};

const getUserByIdService = async (userId) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "No user found with the provided ID. Please provide a valid user ID.",
    );
  }
  return user;
};

const updateUserService = async ({ userId, updatedData, file }) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "No user found with the provided ID. Please provide a valid user ID.",
    );
  }

  if (file) {
    await deleteUserImageService(user);
    await uploadUserImageService(user, file);
  }

  // Prevent updating role and password through this endpoint
  delete updatedData.role;
  delete updatedData.password;

  Object.assign(user, updatedData);
  await user.save();

  return user;
};

const deleteUserService = async (userId, currentUser) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "No user found with the provided ID. Please provide a valid user ID.",
    );
  }

  const isOwner = currentUser._id.toString() === userId.toString();
  const isSuperAdmin = user.role === "super-admin";
  const isAdmin = user.role === "admin";

  if (
    (isSuperAdmin && !isOwner) ||
    (isAdmin && currentUser.role !== "super-admin" && !isOwner)
  ) {
    throw new ApiError(403, "You do not have permission to delete this user.");
  }

  const session = await UserModel.startSession();

  try {
    await session.withTransaction(async () => {
      if (isSuperAdmin) {
        await handleSuperAdminRoleTransition(session, "delete");
      }

      if (isAdmin) {
        await handleAdminRoleTransition(session, "delete");
      }

      await UserModel.findByIdAndDelete(userId, { session });

      await ReviewModel.deleteMany({ user: userId }, { session });

      await RefreshTokenModel.deleteMany({ user: userId }, { session });
    });
  } finally {
    await session.endSession();
  }

  await deleteUserImageService(user);

  return user;
};

const uploadUserImageService = async (user, file) => {
  if (file) {
    const { secure_url: image_url, public_id } = await uploadToCloudinary(
      file.buffer,
      "users/profile-images",
    );

    user.image = { image_url, public_id };
    return user;
  }
};

const deleteUserImageService = async (user) => {
  if (user.image.public_id !== "users/profile-images/uvjrevfifa7lvkpn3o3k") {
    await deleteFromCloudinary(user.image.public_id);
  }
};

module.exports = {
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  uploadUserImageService,
  deleteUserImageService,
};
