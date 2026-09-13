const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const ApiError = require("../utils/apiError");

const {
  createReviewService,
  getReviewsService,
  getReviewByIdService,
  updateReviewService,
  deleteReviewService,
} = require("../services/review.service");

const createReview = asyncWrapper(async (req, res, next) => {
  const reviewData = req.body;
  reviewData.user = req.user._id;

  if (req.params.productId && !reviewData.productId) {
    reviewData.productId = req.params.productId;
  }

  const review = await createReviewService(reviewData);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Review created successfully",
    data: { review },
  });
});

const getReviews = asyncWrapper(async (req, res, next) => {
  const { reviews, paginatedResults } = await getReviewsService({
    query: req.query,
    productId: req.params.productId,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { reviews },
  });
});

const getReviewById = asyncWrapper(async (req, res, next) => {
  const { id, productId } = req.params;

  const review = await getReviewByIdService(id, productId);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { review },
  });
});

const updateReview = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (
    (!req.body || Object.keys(req.body).length === 0) &&
    !req.body?.comment &&
    !req.body?.rating
  ) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const updatedReview = await updateReviewService({
    reviewId: id,
    updateData: req.body,
    userId: req.user._id,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Review updated successfully",
    data: { review: updatedReview },
  });
});

const deleteReview = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const deletedReview = await deleteReviewService({
    reviewId: id,
    user: req.user,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Review deleted successfully",
    data: { review: deletedReview },
  });
});

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
