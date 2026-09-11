const CategoryModel = require("../models/category.model");
const SubcategoryModel = require("../models/subcategory.model");
const ProductModel = require("../models/product.model");

const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const createSubcategoryService = async (name, categoryId) => {
  const existingSubcategory = await SubcategoryModel.exists({
    name,
  });

  if (existingSubcategory) {
    throw new ApiError(
      400,
      "Subcategory already exists. Please choose a different name.",
    );
  }

  const existingCategory = await CategoryModel.exists({ _id: categoryId });

  if (!existingCategory) {
    throw new ApiError(
      400,
      "The specified category does not exist. Please provide a valid category ID.",
    );
  }

  const newSubcategory = await SubcategoryModel.create({
    name,
    category: categoryId,
  });

  await newSubcategory.populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  return newSubcategory;
};

const getSubcategoriesService = async ({ query, id }) => {
  if (id) {
    const categoryExists = await CategoryModel.exists({ _id: id });

    if (!categoryExists) {
      throw new ApiError(
        400,
        "The specified category does not exist. Please provide a valid category ID.",
      );
    }
  }

  const apiFeatures = new ApiFeatures(SubcategoryModel.find(), query);

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
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const subcategories = await apiFeatures.query;

  return {
    subcategories,
    paginatedResults: apiFeatures.paginatedResults,
  };
};

const getSubcategoryByIdService = async (id) => {
  const subcategory = await SubcategoryModel.findById(id);

  if (!subcategory) {
    throw new ApiError(
      404,
      "Subcategory not found. Please provide a valid subcategory ID.",
    );
  }

  await subcategory.populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  return subcategory;
};

const updateSubcategoryService = async ({ id, name, category }) => {
  const subcategory = await SubcategoryModel.findById(id);

  if (!subcategory) {
    throw new ApiError(
      404,
      "Subcategory not found. Please provide a valid subcategory ID.",
    );
  }

  if (name) {
    const existingSubcategory = await SubcategoryModel.exists({
      _id: { $ne: id },
      name,
    });

    if (existingSubcategory) {
      throw new ApiError(
        400,
        "Subcategory with this name already exists. Please choose a different name.",
      );
    }

    subcategory.name = name;
  }

  if (category) {
    const existingCategory = await CategoryModel.exists({ _id: category });

    if (!existingCategory) {
      throw new ApiError(
        400,
        "The specified category does not exist. Please provide a valid category ID.",
      );
    }

    subcategory.category = category;
  }

  await subcategory.save();

  await subcategory.populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  return subcategory;
};

const deleteSubcategoryService = async (id, externalSession = null) => {
  const subcategory = await SubcategoryModel.findById(id);

  if (!subcategory) {
    throw new ApiError(
      404,
      "Subcategory not found. Please provide a valid subcategory ID.",
    );
  }

  const products = [];

  const deleteOperations = async (session) => {
    const associatedProducts = await ProductModel.find({
      subcategories: id,
    }).session(session);

    for (const product of associatedProducts) {
      await ProductModel.findByIdAndUpdate(
        product._id,
        { $pull: { subcategories: id } },
        { session },
      );
    }

    await SubcategoryModel.findByIdAndDelete(id, { session });

    products.push(...associatedProducts);
  };

  if (externalSession) {
    await deleteOperations(externalSession);
  } else {
    const session = await SubcategoryModel.startSession();

    try {
      await session.withTransaction(async () => {
        await deleteOperations(session);
      });
    } finally {
      await session.endSession();
    }
  }

  await subcategory.populate({
    path: "category",
    select: "-createdAt -updatedAt",
  });

  return {
    subcategory,
    products,
  };
};

module.exports = {
  createSubcategoryService,
  getSubcategoriesService,
  getSubcategoryByIdService,
  updateSubcategoryService,
  deleteSubcategoryService,
};
