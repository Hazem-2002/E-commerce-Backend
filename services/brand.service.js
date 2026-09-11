const BrandModel = require("../models/brand.madel");
const ProductModel = require("../models/product.model");

const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service");

const {
  deleteProductService,
  deleteProductImages,
} = require("./product.service");

const createBrandService = async (name, file) => {
  const existingBrand = await BrandModel.exists({ name });
  if (existingBrand) {
    throw new ApiError(
      400,
      "Brand already exists. Please choose a different name.",
    );
  }

  const { secure_url: image_url, public_id } = await uploadToCloudinary(
    file.buffer,
    "brands",
  );

  try {
    const brand = await BrandModel.create({
      name,
      image: { image_url, public_id },
    });

    return brand;
  } catch (error) {
    await deleteFromCloudinary(public_id);
    throw error;
  }
};

const getBrandsService = async (query) => {
  const apiFeatures = new ApiFeatures(BrandModel.find(), query);

  apiFeatures
    .filter()
    .search()
    .paginate(await BrandModel.countDocuments(apiFeatures.filters))
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

  const brands = await apiFeatures.query;

  return { brands, paginatedResults: apiFeatures.paginatedResults };
};

const getBrandByIdService = async (id) => {
  const brand = await BrandModel.findById(id);
  if (!brand) {
    throw new ApiError(
      404,
      "Brand not found. Please provide a valid brand ID.",
    );
  }
  return brand;
};

const updateBrandService = async ({ id, name, file }) => {
  const brand = await BrandModel.findById(id);
  if (!brand) {
    throw new ApiError(
      404,
      "Brand not found. Please provide a valid brand ID.",
    );
  }

  if (!name && !file) {
    throw new ApiError(
      400,
      "No data provided for update. Please provide at least one field to update.",
    );
  }

  if (name) {
    const existingBrand = await BrandModel.exists({ name, _id: { $ne: id } });
    if (existingBrand) {
      throw new ApiError(
        400,
        "Brand already exists. Please choose a different name.",
      );
    }

    brand.name = name;
  }

  if (file) {
    const { secure_url: image_url, public_id } = await uploadToCloudinary(
      file.buffer,
      "brands",
    );

    await deleteFromCloudinary(brand.image.public_id);

    brand.image = { image_url, public_id };
  }

  await brand.save();

  return brand;
};

const deleteBrandService = async (id) => {
  const brand = await BrandModel.findById(id);

  if (!brand) {
    throw new ApiError(
      404,
      "Brand not found. Please provide a valid brand ID.",
    );
  }

  const products = [];

  const session = await BrandModel.startSession();

  try {
    await session.withTransaction(async () => {
      const associatedProducts = await ProductModel.find({
        brand: id,
      }).session(session);

      products.push(...associatedProducts);

      for (const product of associatedProducts) {
        await deleteProductService(product._id, session);
      }

      await BrandModel.findByIdAndDelete(id, { session });
    });
  } finally {
    await session.endSession();
  }

  return {
    brand,
    products,
  };
};

const deleteBrandImages = async (brand, products) => {
  const deleteProductsImagesPromises = products.map(async (product) => {
    await deleteProductImages(product);
  });

  await Promise.all(deleteProductsImagesPromises);

  if (brand.image?.public_id) {
    await deleteFromCloudinary(brand.image.public_id);
  }
};

module.exports = {
  createBrandService,
  getBrandsService,
  getBrandByIdService,
  updateBrandService,
  deleteBrandService,
  deleteBrandImages,
};
