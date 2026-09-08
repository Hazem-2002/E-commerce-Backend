const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: [true, "Category name must be unique"],
      minlength: [3, "Category name must be at least 3 characters long"],
      maxlength: [50, "Category name must be at most 50 characters long"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Category slug is required"],
      lowercase: true,
    },

    image: {
      type: {
        image_url: String,
        public_id: String,
      },
      required: [true, "Category image is required"],
    },
  },
  { timestamps: true },
);

categorySchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// Pre-save middleware to generate slug from name
categorySchema.pre(/update/i, function () {
  const update = this.getUpdate().$set || this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true });
  }
});

// Instance method to select specific fields from the category document
categorySchema.methods.selectFields = function (fields) {
  const thisObject = this.toObject();
  fields = fields.split(" ");
  for (const key in thisObject) {
    if (!fields.includes(key)) {
      delete thisObject[key];
    }
  }
  return thisObject;
};

const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
