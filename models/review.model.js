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

// Ensure that a user can only leave one review per product
reviewSchema.index({ productId: 1, user: 1 }, { unique: true });

reviewSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

reviewSchema.statics.calculateRatings = async function (
  productId,
  session = null,
) {
  const query = this.aggregate([
    { $match: { productId: productId } },
    {
      $group: {
        _id: "$productId",
        ratingsAverage: { $avg: "$rating" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  if (session) {
    query.session(session);
  }

  const result = await query;

  return {
    ratingsAverage: Math.round((result[0]?.ratingsAverage || 0) * 10) / 10,
    ratingsQuantity: result[0]?.ratingsQuantity || 0,
  };
};

const ReviewModel = mongoose.model("Review", reviewSchema);

module.exports = ReviewModel;
