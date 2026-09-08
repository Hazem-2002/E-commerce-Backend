const slugify = require("slugify");
const mongoose = require("mongoose");

const CategoryModel = require("../models/category.model");
const SubcategoryModel = require("../models/subcategory.model");

const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");

const createCategory = asyncWrapper(async (req, res, next) => {
  const { name } = req.body;

  const existingCategory = await CategoryModel.exists({ name });

  if (existingCategory) {
    return next(new ApiError(400, "category already exists"));
  }

  const { secure_url: image_url, public_id } = await uploadToCloudinary(
    req.file.buffer,
    "categories",
  );

  const slug = slugify(name, { lower: true });

  const category = await CategoryModel.create({
    name,
    slug,
    image: { image_url, public_id },
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: `Category created successfully`,
    data: { category },
  });
});

const getCategories = asyncWrapper(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(CategoryModel.find(), req.query);

  apiFeatures
    .filter()
    .search()
    .paginate(await CategoryModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields();

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    return next(
      new ApiError(
        400,
        "Invalid page number. The requested page exceeds the total number of pages.",
      ),
    );
  }

  const categories = await apiFeatures.query;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...apiFeatures.paginatedResults,
    data: { categories },
  });
});

const getCategoryById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const category = await CategoryModel.findById(id);

  if (!category) {
    return next(new ApiError(404, "category not found"));
  }

  res.status(200).json({ status: httpStatusText.SUCCESS, data: { category } });
});

const updateCategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!req.body) {
    return next(new ApiError(400, "No data provided for update"));
  }

  const category = await CategoryModel.findById(id);

  if (!category) {
    return next(new ApiError(404, "category not found"));
  }

  const { name } = req.body;

  if (name) {
    const existingCategory = await CategoryModel.findOne({
      name,
    });

    if (existingCategory && existingCategory._id.toString() !== id) {
      return next(new ApiError(400, "category already exists"));
    }
  }

  if (req.file) {
    const { secure_url: image_url, public_id } = await uploadToCloudinary(
      req.file.buffer,
      "categories",
    );

    await deleteFromCloudinary(category.image.public_id);

    req.body.image = { image_url, public_id };
  }

  const updatedCategory = await CategoryModel.findByIdAndUpdate(
    id,
    { $set: req.body },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Category updated successfully",
    data: { category: updatedCategory },
  });
});

const deleteCategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const category = await CategoryModel.findById(id);

  if (!category) {
    return next(new ApiError(404, "Category not found"));
  }

  const session = await mongoose.startSession();

  let subcategories = [];

  try {
    await session.withTransaction(async () => {
      // Find related subcategories
      subcategories = await SubcategoryModel.find({
        category: id,
      }).session(session);

      // Delete category
      await CategoryModel.findByIdAndDelete(id).session(session);

      // Delete related subcategories
      await SubcategoryModel.deleteMany({ category: id }).session(session);
    });

    // Delete category image from Cloudinary after successful transaction
    await deleteFromCloudinary(category.image.public_id);

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Category and its related subcategories deleted successfully",
      data: {
        category: category.selectFields("_id name slug createdAt updatedAt"),
        subcategories,
      },
    });
  } finally {
    await session.endSession();
  }
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
