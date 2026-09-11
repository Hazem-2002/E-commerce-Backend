const CategoryModel = require("../models/category.model");
const SubcategoryModel = require("../models/subcategory.model");
const ProductModel = require("../models/product.model");

const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const {
  deleteProductService,
  deleteProductImages,
} = require("./product.service");

const { deleteSubcategoryService } = require("./subcategory.service");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service");

const createCategoryService = async (name, file) => {
  const existingCategory = await CategoryModel.exists({ name });

  if (existingCategory) {
    throw new ApiError(
      400,
      "Category already exists. Please choose a different name.",
    );
  }

  const { secure_url: image_url, public_id } = await uploadToCloudinary(
    file.buffer,
    "categories",
  );

  const category = await CategoryModel.create({
    name,
    image: { image_url, public_id },
  });

  return category;
};

const getCategoriesService = async (query) => {
  const apiFeatures = new ApiFeatures(CategoryModel.find(), query);

  apiFeatures
    .filter()
    .search()
    .paginate(await CategoryModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields();

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const categories = await apiFeatures.query;

  return { categories, paginatedResults: apiFeatures.paginatedResults };
};

const getCategoryByIdService = async (id) => {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw new ApiError(
      404,
      "Category not found. Please provide a valid category ID.",
    );
  }
  return category;
};

const updateCategoryService = async ({ id, name, file }) => {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw new ApiError(
      404,
      "Category not found. Please provide a valid category ID.",
    );
  }

  if (name) {
    const existingCategory = await CategoryModel.findOne({
      name,
    });

    if (existingCategory && existingCategory._id.toString() !== id) {
      throw new ApiError(
        400,
        "Category already exists. Please choose a different name.",
      );
    }

    category.name = name;
  }

  if (file) {
    const { secure_url: image_url, public_id } = await uploadToCloudinary(
      file.buffer,
      "categories",
    );

    await deleteFromCloudinary(category.image.public_id);

    category.image = { image_url, public_id };
  }

  await category.save();

  return category;
};

const deleteCategoryService = async (id) => {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw new ApiError(
      404,
      "Category not found. Please provide a valid category ID.",
    );
  }
  const subcategories = [];
  const products = [];

  const session = await CategoryModel.startSession();

  try {
    await session.withTransaction(async () => {
      const associatedSubcategories = await SubcategoryModel.find({
        category: id,
      }).session(session);

      const associatedProducts = await ProductModel.find({
        category: id,
      }).session(session);

      for (const product of associatedProducts) {
        await deleteProductService(product._id, session);
      }

      for (const subcategory of associatedSubcategories) {
        await deleteSubcategoryService(subcategory._id, session);
      }

      await CategoryModel.findByIdAndDelete(id, { session });

      subcategories.push(...associatedSubcategories);
      products.push(...associatedProducts);
    });
  } finally {
    await session.endSession();
  }

  await deleteCategoryImages(category, products);

  return {
    category,
    subcategories,
    products,
  };
};

const deleteCategoryImages = async (category, products) => {
  const deleteProductsImagesPromises = products.map(async (product) => {
    await deleteProductImages(product);
  });

  await Promise.all(deleteProductsImagesPromises);

  await deleteFromCloudinary(category.image.public_id);
};

module.exports = {
  createCategoryService,
  getCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService,
  deleteCategoryImages,
};
