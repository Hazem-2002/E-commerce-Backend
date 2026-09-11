const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const ApiFeatures = require("../utils/apiFeatures");

const ReviewModel = require("../models/review.model");

const getReviews = asyncWrapper(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(ReviewModel.find(), req.query);

  apiFeatures
    .filter()
    .search()
    .paginate(await ReviewModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields();

  const reviews = await apiFeatures.query;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...apiFeatures.paginatedResults,
    data: { reviews },
  });
});

const createReview = asyncWrapper(async (req, res, next) => {
  req.body.user = req.user._id;

  const review = await ReviewModel.create(req.body);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { review },
  });
});

module.exports = {
  getReviews,
  createReview,
};
