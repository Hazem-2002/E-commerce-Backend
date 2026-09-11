const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const {
  createSubcategoryService,
  getSubcategoriesService,
  getSubcategoryByIdService,
  updateSubcategoryService,
  deleteSubcategoryService,
} = require("../services/subcategory.service");

const createSubcategory = asyncWrapper(async (req, res, next) => {
  const { name, category } = req.body;

  const newSubcategory = await createSubcategoryService(name, category);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: `Subcategory created successfully`,
    data: { subcategory: newSubcategory },
  });
});

const getSubcategories = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const { subcategories, paginatedResults } = await getSubcategoriesService({
    query: req.query,
    id,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { subcategories },
  });
});

const getSubcategoryById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await getSubcategoryByIdService(id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { subcategory },
  });
});

const updateSubcategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { name, category } = req.body;

  if (!req.body || Object.keys(req.body).length === 0) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const subcategory = await updateSubcategoryService({ id, name, category });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Subcategory updated successfully",
    data: { subcategory },
  });
});

const deleteSubcategory = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const { subcategory } = await deleteSubcategoryService(id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
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
