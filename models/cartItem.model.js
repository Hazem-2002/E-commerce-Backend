const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "Cart is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    variants: {
      type: [
        {
          variantId: {
            type: mongoose.Schema.Types.ObjectId,
            trim: true,
            required: [true, "Variant ID is required"],
          },
          
          quantity: {
            type: Number,
            required: [true, "Variant quantity is required"],
            min: 1,
          },

          color: {
            color: {
              type: String,
              trim: true,
            },
            hex: {
              type: String,
              trim: true,
              match: [
                /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                "Product color hex is not valid",
              ],
              required: [true, "Product variant color hex is required"],
            },
          },

          size: {
            type: String,
            trim: true,
          },

          price: {
            type: Number,
            min: 0,
          },

          priceAfterDiscount: {
            type: Number,
            min: 0,
            validate: {
              validator: function (value) {
                return value <= this.price;
              },
              message:
                "Price after discount ({VALUE}) should be less than or equal to the original price",
            },
            default: function () {
              return this.price;
            },
          },

          image: {
            type: {
              image_url: {
                type: String,
                required: [true, "Product variant image URL is required"],
              },
              public_id: {
                type: String,
                required: [true, "Product variant image public ID is required"],
              },
            },
          },
        },
      ],
      default: [],
    },
    totalItemPrice: {
      type: Number,
      required: [true, "Total item price is required"],
      min: 0,
    },
    totalItemDiscount: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.totalItemPrice;
        },
        message: "Total item discount cannot be greater than total item price",
      },
    },
    totalItemPriceAfterDiscount: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.totalItemPrice;
        },
        message:
          "Total item price after discount cannot be greater than total item price",
      },
    },
  },
  { timestamps: true },
);

cartItemSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.cart;
    return ret;
  },
});

const CartItemModel = mongoose.model("CartItem", cartItemSchema);

module.exports = CartItemModel;
