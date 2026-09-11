const express = require("express");

const authenticate = require("../middlewares/authenticate");

const {
  getReviews,
  createReview,
} = require("../controllers/review.controller");

const {
  createReviewValidator,
} = require("../middlewares/validators/review.validator");

const validate = require("../middlewares/validators/validate");

const router = express.Router();

router
  .route("/")
  .get(getReviews)
  .post(authenticate, createReviewValidator, validate, createReview);

module.exports = router;
