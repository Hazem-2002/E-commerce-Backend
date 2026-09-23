const ProductModel = require("../models/product.model");
const ReviewModel = require("../models/review.model");
const UserModel = require("../models/users.model");

const ApiFeatures = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");

const createReviewService = async (reviewData) => {
  // Check if the product exists before creating a review
  if (!(await ProductModel.exists({ _id: reviewData.productId }))) {
    throw new ApiError(
      400,
      "The specified product does not exist. Please provide a valid product ID.",
    );
  }

  // Check if the user has already submitted a review for the same product
  if (
    await ReviewModel.exists({
      user: reviewData.user,
      productId: reviewData.productId,
    })
  ) {
    throw new ApiError(
      400,
      "You have already submitted a review for this product. Please update your existing review instead.",
    );
  }

  const review = new ReviewModel(reviewData);

  const session = await ReviewModel.startSession();

  try {
    await session.withTransaction(async () => {
      await review.save({ session });

      await updateProductRatings(review.productId, session);
    });
  } finally {
    await session.endSession();
  }

  await review.populate([
    { path: "user", select: "name email" },
    {
      path: "productId",
      select:
        "name sold productCover ratingsAverage ratingsQuantity isFeatured",
    },
  ]);
  return review;
};

const getReviewsService = async ({ query, productId, userId }) => {
  if (userId) {
    const userExists = await UserModel.exists({ _id: userId });
    if (!userExists) {
      throw new ApiError(
        400,
        "The specified user does not exist. Please provide a valid user ID.",
      );
    }
  }

  if (productId) {
    const productExists = await ProductModel.exists({ _id: productId });

    if (!productExists) {
      throw new ApiError(
        400,
        "The specified product does not exist. Please provide a valid product ID.",
      );
    }
  }

  const apiFeatures = new ApiFeatures(ReviewModel.find(), query);

  apiFeatures
    .filter(productId ? { productId } : userId ? { user: userId } : {})
    .paginate(await ReviewModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields(productId ? "-productId" : userId ? "-user" : "")
    .populate(
      productId
        ? [{ path: "user", select: "name email image" }]
        : userId
          ? [
              {
                path: "productId",
                select:
                  "name sold productCover ratingsAverage ratingsQuantity isFeatured",
              },
            ]
          : [
              { path: "user", select: "name email image" },
              {
                path: "productId",
                select:
                  "name sold productCover ratingsAverage ratingsQuantity isFeatured",
              },
            ],
    );

  const reviews = await apiFeatures.query;

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  return { reviews, paginatedResults: apiFeatures.paginatedResults };
};

const getReviewByIdService = async (reviewId, productId) => {
  if (productId) {
    const productExists = await ProductModel.exists({ _id: productId });

    if (!productExists) {
      throw new ApiError(
        400,
        "The specified product does not exist. Please provide a valid product ID.",
      );
    }
  }

  const review = await ReviewModel.findOne({
    _id: reviewId,
    ...(productId ? { productId } : {}),
  });

  if (!review) {
    throw new ApiError(
      404,
      "Review not found. Please check the provided review ID.",
    );
  }

  await review.populate([
    { path: "user", select: "name email image" },
    {
      path: "productId",
      select:
        "name sold productCover ratingsAverage ratingsQuantity isFeatured",
    },
  ]);

  return review;
};

const updateReviewService = async ({ reviewId, updateData, userId }) => {
  const review = await ReviewModel.findById(reviewId);

  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this review. Only the review owner can perform this action.",
    );
  }

  if (!review) {
    throw new ApiError(
      404,
      "Review not found. Please check the provided review ID.",
    );
  }

  delete updateData.user;
  delete updateData.productId;

  Object.assign(review, updateData);

  const session = await ReviewModel.startSession();

  try {
    await session.withTransaction(async () => {
      await review.save({ session });

      await updateProductRatings(review.productId, session);
    });
  } finally {
    await session.endSession();
  }

  await review.populate([
    { path: "user", select: "name email image" },
    {
      path: "productId",
      select:
        "name sold productCover ratingsAverage ratingsQuantity isFeatured",
    },
  ]);

  return review;
};

const deleteReviewService = async ({ reviewId, user }) => {
  const review = await ReviewModel.findById(reviewId);

  if (user.role === "user" && review.user.toString() !== user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to delete this review. Only the review owner and administrators can perform this action.",
    );
  }

  if (!review) {
    throw new ApiError(
      404,
      "Review not found. Please check the provided review ID.",
    );
  }

  const session = await ReviewModel.startSession();

  try {
    await session.withTransaction(async () => {
      await ReviewModel.findByIdAndDelete(reviewId, { session });

      await updateProductRatings(review.productId, session);
    });
  } finally {
    await session.endSession();
  }

  await review.populate([
    { path: "user", select: "name email image" },
    {
      path: "productId",
      select:
        "name sold productCover ratingsAverage ratingsQuantity isFeatured",
    },
  ]);

  return review;
};

const updateProductRatings = async (productId, session = null) => {
  const { ratingsAverage, ratingsQuantity } =
    await ReviewModel.calculateRatings(productId, session);

  const query = ProductModel.findByIdAndUpdate(productId, {
    $set: { ratingsAverage, ratingsQuantity },
  });

  if (session) {
    query.session(session);
  }

  await query;
};

module.exports = {
  createReviewService,
  getReviewsService,
  getReviewByIdService,
  updateReviewService,
  deleteReviewService,
  updateProductRatings,
};
