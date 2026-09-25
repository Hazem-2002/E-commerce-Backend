const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "User is required"],
        },
        name: {
          type: String,
          required: [true, "User name is required"],
          trim: true,
        },
        email: {
          type: String,
          required: [true, "User email is required"],
          trim: true,
          match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
          ],
        },
        phone: {
          type: String,
          required: [true, "User phone number is required"],
          trim: true,
        },
      },
      required: [true, "User is required"],
    },
    cartItems: {
      type: [
        {
          product: {
            type: {
              _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: [true, "Product is required"],
              },

              name: {
                type: String,
                required: [true, "Product name is required"],
                minlength: [
                  3,
                  "Product name must be at least 3 characters long",
                ],
                maxlength: [
                  100,
                  "Product name must be at most 100 characters long",
                ],
                trim: true,
              },

              sku: {
                type: String,
                trim: true,
                validate: {
                  validator: function (value) {
                    return /^[A-Z0-9_-]{3,50}$/.test(value);
                  },
                  message:
                    "Product SKU must be alphanumeric, uppercase, and can include underscores and hyphens. Length should be between 3 and 50 characters.",
                },
              },

              productCover: {
                type: {
                  image_url: String,
                  public_id: String,
                },
                required: [true, "Product cover image is required"],
              },

              price: {
                type: Number,
                required: [true, "Product price is required"],
                min: [0, "Product price must be a positive number"],
              },

              priceAfterDiscount: {
                type: Number,
                validate: {
                  validator: function (value) {
                    return value <= this.price;
                  },
                  message:
                    "Price after discount ({VALUE}) should be less than the original price",
                },
              },

              category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
                required: [true, "Product category is required"],
              },

              subcategories: {
                type: [
                  {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Subcategory",
                  },
                ],
                default: [],
              },

              brand: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Brand",
                required: [true, "Product brand is required"],
              },
            },
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
                      required: [
                        true,
                        "Product variant image public ID is required",
                      ],
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
            required: [true, "Total item discount is required"],
            min: 0,
            validate: {
              validator: function (value) {
                return value <= this.totalItemPrice;
              },
              message:
                "Total item discount cannot be greater than total item price",
            },
          },

          totalItemPriceAfterDiscount: {
            type: Number,
            required: [true, "Total item price after discount is required"],
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
      ],
      required: [true, "Cart items are required"],
    },
    shippingAddress: {
      type: {
        fullName: {
          type: String,
          required: [true, "Full name is required"],
          trim: true,
        },

        phone: {
          type: String,
          required: [true, "Phone number is required"],
          trim: true,
        },

        country: {
          type: String,
          required: [true, "Country is required"],
          trim: true,
        },

        city: {
          type: String,
          required: [true, "City is required"],
          trim: true,
        },

        district: {
          type: String,
          required: [true, "District is required"],
          trim: true,
        },

        street: {
          type: String,
          required: [true, "Street is required"],
          trim: true,
        },

        building: {
          type: String,
          required: [true, "Building is required"],
          trim: true,
        },

        apartment: {
          type: String,
          trim: true,
        },

        postalCode: {
          type: String,
          trim: true,
        },
      },
    },
    shippingPrice: {
      type: Number,
      required: [true, "Shipping price is required"],
    },
    taxPrice: {
      type: Number,
      required: [true, "Tax price is required"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
    },
    totalDiscount: {
      type: Number,
    },
    totalPriceAfterDiscount: {
      type: Number,
    },
    finalPrice: {
      type: Number,
      required: [true, "Final price is required"],
      min: [0, "Final price must be a positive number"],
    },
    quantity: {
      type: Number,
      required: [true, "Total quantity is required"],
    },
    coupon: {
      type: {
        code: {
          type: String,
          required: [true, "Coupon code is required"],
          trim: true,
        },
        discount: {
          type: Number,
          required: [true, "Discount is required"],
        },
      },
      default: null,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["credit_card", "paypal", "bank_transfer", "cash_on_delivery"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    payment: {
      transactionId: String,
      provider: String,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

orderSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const OrderModel = mongoose.model("Order", orderSchema);

module.exports = OrderModel;
