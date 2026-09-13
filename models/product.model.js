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
          return value < this.price;
        },
        message:
          "Price after discount ({VALUE}) should be less than the original price",
      },
    },
    colors: {
      type: [
        {
          color: {
            type: String,
            trim: true,
          },
          hex: {
            type: String,
            required: [true, "Product color hex is required"],
            trim: true,
            match: [
              /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
              "Product color hex is not valid",
            ],
          },
          quantity: {
            type: Number,
            required: [true, "Product color quantity is required"],
            min: 0,
          },
        },
      ],
      default: [],
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

        ret.colors?.forEach((color) => {
          delete color.id;
          delete color._id;
        });

        ret.productImages?.forEach((image) => {
          delete image.id;
          delete image._id;
        });

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
