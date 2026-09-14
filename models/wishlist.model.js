const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

wishlistSchema.virtual("products", {
  ref: "WishlistItem",
  localField: "_id",
  foreignField: "wishlist",
});

wishlistSchema.methods.getWishlistProducts = async function () {
  const wishlist = await this.populate({
    path: "products",
    select: "product -wishlist -_id",
    populate: {
      path: "product",
      select:
        "name price priceAfterDiscount productCover ratingsAverage ratingsQuantity isFeatured slug",
    },
  });

  return wishlist.products.map((item) => item.product);
};

const WishlistModel = mongoose.model("Wishlist", wishlistSchema);

module.exports = WishlistModel;
