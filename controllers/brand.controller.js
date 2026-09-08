const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");

const ApiFeatures = require("../utils/apiFeatures");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");

const ApiError = require("../utils/apiError");

const BrandModel = require("../models/brand.madel");

const createBrand = asyncWrapper(async (req, res, next) => {
  const { name } = req.body;

  const existingBrand = await BrandModel.exists({ name });
  if (existingBrand) {
    return next(new ApiError(400, "Brand already exists"));
  }

  const { secure_url: image_url, public_id } = await uploadToCloudinary(
    req.file.buffer,
    "brands",
  );

  const brand = await BrandModel.create({
    name,
    image: { image_url, public_id },
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      brand,
    },
  });
});

const getBrands = asyncWrapper(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(BrandModel.find(), req.query);

  apiFeatures
    .filter()
    .search()
    .paginate(await BrandModel.countDocuments(apiFeatures.filters))
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

  const brands = await apiFeatures.query;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...apiFeatures.paginatedResults,
    data: {
      brands,
    },
  });
});

const getBrandById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const brand = await BrandModel.findById(id);
  if (!brand) {
    return next(new ApiError(404, "Brand not found"));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      brand,
    },
  });
});

const updateBrand = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!req.body) {
    return next(new ApiError(400, "No data provided for update"));
  }

  const { name } = req.body;

  const brand = await BrandModel.findById(id);
  if (!brand) {
    return next(new ApiError(404, "Brand not found"));
  }

  if (!name && !req.file) {
    return next(
      new ApiError(
        400,
        "At least one field (name or image) must be provided for update",
      ),
    );
  }

  if (name) {
    const existingBrand = await BrandModel.exists({ name, _id: { $ne: id } });
    if (existingBrand) {
      return next(new ApiError(400, "Brand already exists"));
    }

    brand.name = name;
  }

  if (req.file) {
    const { secure_url: image_url, public_id } = await uploadToCloudinary(
      req.file.buffer,
      "brands",
    );

    await deleteFromCloudinary(brand.image.public_id);

    brand.image = { image_url, public_id };
  }

  await brand.save();

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

  const brand = await BrandModel.findById(id);
  if (!brand) {
    return next(new ApiError(404, "Brand not found"));
  }

  await deleteFromCloudinary(brand.image.public_id);

  await BrandModel.findByIdAndDelete(id);

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
