const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const {
  createCategoryService,
  getCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService,
} = require("../services/category.service");

const createCategory = asyncWrapper(async (req, res, next) => {
  const { name } = req.body;

  const category = await createCategoryService(name, req.file);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: `Category created successfully`,
    data: { category },
  });
});

const getCategories = asyncWrapper(async (req, res, next) => {
  const { categories, paginatedResults } = await getCategoriesService(
    req.query,
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { categories },
  });
});

const getCategoryById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const category = await getCategoryByIdService(id);

  res.status(200).json({ status: httpStatusText.SUCCESS, data: { category } });
});

const updateCategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const category = await updateCategoryService({ id, name, file: req.file });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Category updated successfully",
    data: { category },
  });
});

const deleteCategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const { category } = await deleteCategoryService(id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message:
      "Category and its associated subcategories and products deleted successfully",
    data: {
      category: category.selectFields("_id name slug createdAt updatedAt"),
    },
  });
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
