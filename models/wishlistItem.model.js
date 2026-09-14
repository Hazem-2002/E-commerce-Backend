const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    wishlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wishlist",
      required: [true, "Wishlist ID is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
  },
  { timestamps: true },
);

wishlistItemSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const WishlistItemModel = mongoose.model("WishlistItem", wishlistItemSchema);

module.exports = WishlistItemModel;
