const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const {
  createBrandService,
  getBrandsService,
  getBrandByIdService,
  updateBrandService,
  deleteBrandService,
  deleteBrandImages,
} = require("../services/brand.service");

const createBrand = asyncWrapper(async (req, res, next) => {
  const { name } = req.body;

  const brand = await createBrandService(name, req.file);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      brand,
    },
  });
});

const getBrands = asyncWrapper(async (req, res, next) => {
  const { brands, paginatedResults } = await getBrandsService(req.query);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: {
      brands,
    },
  });
});

const getBrandById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const brand = await getBrandByIdService(id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      brand,
    },
  });
});

const updateBrand = asyncWrapper(async (req, res, next) => {
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

  const brand = await updateBrandService({ id, name, file: req.file });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Brand updated successfully",
    data: {
      brand,
    },
  });
});

const deleteBrand = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const { brand, products } = await deleteBrandService(id);

  await deleteBrandImages(brand, products);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Brand deleted successfully",
    data: {
      brand,
    },
  });
});

module.exports = {
  getBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
};
