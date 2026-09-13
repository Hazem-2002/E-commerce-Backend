const AsyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const { getReviewsService } = require("../services/review.service");

const {
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} = require("../services/users.service");

const getUsers = AsyncWrapper(async (req, res, next) => {
  const { users, paginatedResults } = await getUsersService(req.query);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { users },
  });
});

const getUserById = AsyncWrapper(async (req, res, next) => {
  const { userId } = req.params;

  const user = await getUserByIdService(userId);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user },
  });
});

const getMe = AsyncWrapper(async (req, res, next) => {
  const user = await getUserByIdService(req.user._id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user },
  });
});

const getMyReviews = AsyncWrapper(async (req, res, next) => {
  const { reviews, paginatedResults } = await getReviewsService({
    query: req.query,
    userId: req.user._id,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { reviews },
  });
});

const getUserReviews = AsyncWrapper(async (req, res, next) => {
  const { reviews, paginatedResults } = await getReviewsService({
    query: req.query,
    userId: req.params.userId,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { reviews },
  });
});

const updateUser = AsyncWrapper(async (req, res, next) => {
  if (!req.file && !req.body && Object.keys(req.body).length === 0) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const updatedUser = await updateUserService({
    userId: req.params.userId,
    updatedData: req.body,
    file: req.file,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user: updatedUser },
  });
});

const updateMe = AsyncWrapper(async (req, res, next) => {
  if (!req.file && !req.body && Object.keys(req.body).length === 0) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const updatedUser = await updateUserService({
    userId: req.user._id,
    updatedData: req.body,
    file: req.file,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user: updatedUser },
  });
});

const deleteUser = AsyncWrapper(async (req, res, next) => {
  const { userId } = req.params;

  const user = await deleteUserService(userId, req.user);

  if (user._id.toString() === req.user._id.toString()) {
    res.clearCookie("refreshToken");
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User deleted successfully",
    data: { user },
  });
});

const deleteMe = AsyncWrapper(async (req, res, next) => {
  const user = await deleteUserService(req.user._id, req.user);

  res.status(200).clearCookie("refreshToken").json({
    status: httpStatusText.SUCCESS,
    message: "User deleted successfully",
    data: { user },
  });
});

module.exports = {
  getUsers,
  getUserById,
  getMe,
  getMyReviews,
  getUserReviews,
  updateUser,
  updateMe,
  deleteUser,
  deleteMe,
};
