const mongoose = require("mongoose");
const slugify = require("slugify");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      unique: [true, "Brand name must be unique"],
      trim: true,
      minlength: [2, "Brand name must be at least 2 characters long"],
      maxlength: [50, "Brand name must be at most 50 characters long"],
    },
    slug: {
      type: String,
      required: [true, "Brand slug is required"],
      unique: [true, "Brand slug must be unique"],
      trim: true,
    },
    image: {
      type: {
        image_url: String,
        public_id: String,
      },
      required: [true, "Brand image is required"],
    },
  },
  { timestamps: true },
);

// Pre-save middleware to generate slug from name
brandSchema.pre("validate", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
});

// Pre-update middleware to generate slug from name when updating
brandSchema.pre(/update/i, function () {
  const update = this.getUpdate().$set || this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true });
  }
});

// Set toJSON transformation to remove __v field
brandSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const BrandModel = mongoose.model("Brand", brandSchema);

module.exports = BrandModel;
