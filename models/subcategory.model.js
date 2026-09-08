const mongoose = require("mongoose");
const slugify = require("slugify");

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      unique: [true, "Subcategory name must be unique"],
      trim: true,
      minlength: [2, "Subcategory name must be at least 2 characters long"],
      maxlength: [50, "Subcategory name must be at most 50 characters long"],
    },
    slug: {
      type: String,
      required: [true, "Subcategory slug is required"],
      unique: [true, "Subcategory slug must be unique"],
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Subcategory must belong to a category"],
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to generate slug from name
subcategorySchema.pre("validate", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
});

// Pre-update middleware to generate slug from name when updating
subcategorySchema.pre(/update/i, function () {
  const update = this.getUpdate().$set || this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true });
  }
});

// toJSON transformation to remove __v field
subcategorySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = Subcategory;
