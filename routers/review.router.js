const express = require("express");

const authenticate = require("../middlewares/authenticate");

const authorize = require("../middlewares/authorize");

const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");

const {
  createReviewValidator,
  getReviewsValidator,
  getReviewByIdValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require("../middlewares/validators/review.validator");

const validate = require("../middlewares/validators/validate");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getReviewsValidator, validate, getReviews)
  .post(
    authenticate,
    authorize("user"),
    createReviewValidator,
    validate,
    createReview,
  );

router
  .route("/:id")
  .get(getReviewByIdValidator, validate, getReviewById)
  .patch(
    authenticate,
    updateReviewValidator,
    authorize("user"),
    validate,
    updateReview,
  )
  .delete(authenticate, deleteReviewValidator, validate, deleteReview);

module.exports = router;
