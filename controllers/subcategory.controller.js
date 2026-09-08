const SubcategoryModel = require("../models/subcategory.model");
const CategoryModel = require("../models/category.model");

const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");

const ApiFeatures = require("../utils/apiFeatures");

const createSubcategory = asyncWrapper(async (req, res, next) => {
  const { name, category } = req.body;

  const existingSubcategory = await SubcategoryModel.exists({
    name,
  });

  if (existingSubcategory) {
    return next(
      new ApiError(
        400,
        "Subcategory with this name already exists in the specified category",
      ),
    );
  }

  const existingCategory = await CategoryModel.exists({ _id: category });

  if (!existingCategory) {
    return next(new ApiError(400, "There is no category with the provided ID"));
  }

  const newSubcategory = await SubcategoryModel.create({
    name,
    category,
  });

  await newSubcategory.populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  res.status(201).json({
    success: true,
    message: `Subcategory created successfully`,
    data: { subcategory: newSubcategory },
  });
});

const getSubcategories = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (id) {
    const categoryExists = await CategoryModel.exists({ _id: id });

    if (!categoryExists) {
      return next(
        new ApiError(400, "There is no category with the provided ID"),
      );
    }
  }

  const apiFeatures = new ApiFeatures(SubcategoryModel.find(), req.query);

  apiFeatures
    .filter(id ? { category: id } : {})
    .search()
    .paginate(await SubcategoryModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields(id ? "name slug createdAt updatedAt" : "")
    .populate(["category"], "-createdAt -updatedAt");

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

  const subcategories = await apiFeatures.query;

  res.status(200).json({
    success: true,
    ...apiFeatures.paginatedResults,
    data: { subcategories },
  });
});

const getSubcategoryById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await SubcategoryModel.findById(id).populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  if (!subcategory) {
    return next(new ApiError(404, "Subcategory not found"));
  }

  res.status(200).json({
    success: true,
    data: { subcategory },
  });
});

const updateSubcategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { name, category } = req.body;

  if (!name && !category) {
    return next(
      new ApiError(
        400,
        "At least one of 'name' or 'category' must be provided",
      ),
    );
  }

  if (name) {
    const existingSubcategory = await SubcategoryModel.exists({
      _id: { $ne: id },
      name,
    });

    if (existingSubcategory) {
      return next(
        new ApiError(
          400,
          "Subcategory with this name already exists in the specified category",
        ),
      );
    }
  }

  if (category) {
    const existingCategory = await CategoryModel.exists({ _id: category });

    if (!existingCategory) {
      return next(new ApiError(400, "The specified category does not exist"));
    }
  }

  const subcategory = await SubcategoryModel.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true },
  ).populate({ path: "category", select: "-createdAt -updatedAt" });

  if (!subcategory) {
    return next(new ApiError(404, "Subcategory not found"));
  }

  res.status(200).json({
    success: true,
    message: "Subcategory updated successfully",
    data: { subcategory },
  });
});

const deleteSubcategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await SubcategoryModel.findByIdAndDelete(id).populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  if (!subcategory) {
    return next(new ApiError(404, "Subcategory not found"));
  }

  res.status(200).json({
    success: true,
    message: "Subcategory deleted successfully",
    data: { subcategory },
  });
});

module.exports = {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
};
