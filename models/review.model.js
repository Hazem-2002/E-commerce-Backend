const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    rating: {
      type: Number,
      min: [1, "Review rating must be between 1 and 5"],
      max: [5, "Review rating must be between 1 and 5"],
      required: [true, "Review must include a rating"],
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const ReviewModel = mongoose.model("Review", reviewSchema);

module.exports = ReviewModel;
