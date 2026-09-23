const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
    },

    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: 0,
    },

    totalDiscount: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.totalPrice;
        },
        message: "Total discount cannot be greater than total price",
      },
    },

    totalPriceAfterDiscount: {
      type: Number,
      min: 0,
      required: [true, "Total price after discount is required"],
      validate: {
        validator: function (value) {
          return value <= this.totalPrice;
        },
        message:
          "Total price after discount cannot be greater than total price",
      },
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },

    coupon: {
      type: {
        couponId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Coupon",
          required: [true, "Coupon ID is required"],
        },
        code: {
          type: String,
          required: [true, "Coupon code is required"],
        },
        discount: {
          type: Number,
          required: [true, "Coupon discount is required"],
        },
        expiresAt: {
          type: Date,
          required: [true, "Coupon expiration date is required"],
        },
      },
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
  },
);

const CartModel = mongoose.model("Cart", cartSchema);

module.exports = CartModel;
