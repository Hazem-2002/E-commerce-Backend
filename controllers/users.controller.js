const AsyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const ApiFeatures = require("../utils/apiFeatures");
const {
  handleAdminRoleTransition,
  handleSuperAdminRoleTransition,
} = require("../utils/roleTransitions");

const UsersModel = require("../models/users.model");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");

const getUsers = AsyncWrapper(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(UsersModel.find(), req.query);

  apiFeatures
    .filter()
    .search()
    .paginate(await UsersModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields();

  const users = await apiFeatures.query;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...apiFeatures.paginatedResults,
    data: { users },
  });
});

const getUserById = AsyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = await UsersModel.findById(id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user },
  });
});

const updateUser = AsyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!req.file && !req.body) {
    return next(new ApiError(400, "No data provided for update"));
  }

  const user = await UsersModel.findById(id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  if (req.file) {
    if (user.image.public_id !== "users/profile-images/uvjrevfifa7lvkpn3o3k") {
      await deleteFromCloudinary(user.image.public_id);
    }

    const { secure_url: image_url, public_id } = await uploadToCloudinary(
      req.file.buffer,
      "users/profile-images",
    );
    req.body.image = { image_url, public_id };
  }

  // Prevent updating role and password through this endpoint
  delete req.body.role;
  delete req.body.password;

  const updatedUser = await UsersModel.findByIdAndUpdate(
    id,
    { $set: req.body },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user: updatedUser },
  });
});

const deleteUser = AsyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const user = await UsersModel.findById(id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  const isOwner = req.user._id.toString() === id;
  const isSuperAdmin = user.role === "super-admin";
  const isAdmin = user.role === "admin";

  if (
    (isSuperAdmin && !isOwner) ||
    (isAdmin && req.user.role !== "super-admin" && !isOwner)
  ) {
    return next(new ApiError(403, "You are not allowed to delete this user"));
  }

  const session = await UsersModel.startSession();

  try {
    await session.withTransaction(async () => {
      if (isSuperAdmin) {
        await handleSuperAdminRoleTransition(session, "delete");
      }

      if (isAdmin) {
        await handleAdminRoleTransition(session, "delete");
      }

      // await UsersModel.findByIdAndDelete(id).session(session);

      // const publicId = user.image?.public_id;

      // if (
      //   publicId &&
      //   publicId !== "users/profile-images/uvjrevfifa7lvkpn3o3k"
      // ) {
      //   await deleteFromCloudinary(publicId);
      // }
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User deleted successfully",
    data: { user },
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
