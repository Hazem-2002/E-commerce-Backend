const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      minlength: [3, "Product name must be at least 3 characters long"],
      maxlength: [100, "Product name must be at most 100 characters long"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: [true, "Product slug must be unique"],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Product short description is required"],
      minlength: [
        10,
        "Product short description must be at least 10 characters long",
      ],
      maxlength: [
        200,
        "Product short description must be at most 200 characters long",
      ],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [
        10,
        "Product description must be at least 10 characters long",
      ],
      maxlength: [
        200,
        "Product description must be at most 200 characters long",
      ],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [0, "Product quantity must be a positive number"],
    },
    sold: {
      type: Number,
      default: 0,
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
      default: function () {
        return this.price;
      },
    },
    variants: {
      type: [
        {
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
                "Product variant color hex is not valid",
              ],
              required: [true, "Product variant color hex is required"],
            },
          },

          size: {
            type: String,
            trim: true,
          },

          quantity: {
            type: Number,
            required: [true, "Product variant quantity is required"],
            min: 0,
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
    tags: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      trim: true,
      unique: [true, "Product SKU must be unique"],
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
    productImages: {
      type: [
        {
          image_url: String,
          public_id: String,
        },
      ],
      default: [],
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
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating must be at most 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.id;

        delete ret.productCover?.id;
        delete ret.productCover?._id;

        ret.variants?.forEach((variant) => {
          delete variant.id;
          delete variant.image?.id;
          delete variant.image?._id;
        });

        ret.productImages?.forEach((image) => {
          delete image.id;
          delete image._id;
        });

        if (ret.quantity) {
          ret.stock = ret.quantity;
          delete ret.quantity;
        }

        return ret;
      },
    },

    toObject: { virtuals: true },
  },
);

productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "productId",
});

// Pre-save middleware to generate slug from name
productSchema.pre("validate", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
});

// Pre-update middleware to generate slug from name when updating
productSchema.pre(/update/i, function () {
  const update = this.getUpdate().$set || this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true });
  }
});

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
