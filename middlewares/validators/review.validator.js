const {
  mongoIdRule,
  ratingRule,
  commentRule,
} = require("./common/validationRules");

const createReviewValidator = [
  mongoIdRule("productId", "Product ID"),
  ratingRule("rating", "Rating"),
  commentRule("comment", "Comment").optional(),
];

const getReviewsValidator = [mongoIdRule("productId", "Product ID").optional()];

const getReviewByIdValidator = [
  mongoIdRule("productId", "Product ID").optional(),
  mongoIdRule("id", "Review ID"),
];

const updateReviewValidator = [
  mongoIdRule("id", "Review ID"),
  ratingRule("rating", "Rating").optional(),
  commentRule("comment", "Comment").optional(),
];

const deleteReviewValidator = [mongoIdRule("id", "Review ID")];

module.exports = {
  createReviewValidator,
  getReviewsValidator,
  getReviewByIdValidator,
  updateReviewValidator,
  deleteReviewValidator,
};
