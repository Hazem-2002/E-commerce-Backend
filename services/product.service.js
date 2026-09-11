const ProductModel = require("../models/product.model");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service");

const createProductService = async (productData, files) => {
  const existingProduct = await ProductModel.findOne({
    name: productData.name,
  });

  if (existingProduct) {
    throw new ApiError(
      400,
      "Product already exists. Please choose a different name.",
    );
  }

  const product = new ProductModel(productData);

  await uploadProductImages(product, files);

  await product.save();

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  return product;
};

const getProductsService = async (query) => {
  const apiFeatures = new ApiFeatures(ProductModel.find(), query);

  apiFeatures
    .filter()
    .search()
    .paginate(await ProductModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate(["category", "brand", "subcategories"], "name");

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const products = await apiFeatures.query;

  return { products, paginatedResults: apiFeatures.paginatedResults };
};

const getProductByIdService = async (id) => {
  const product = await ProductModel.findById(id)
    .populate({ path: "category", select: "name" })
    .populate({ path: "brand", select: "name" })
    .populate({ path: "subcategories", select: "name" });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }
  return product;
};

const updateProductService = async (id, updatedData, files) => {
  const product = await ProductModel.findById(id);

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  if (updatedData.name) {
    const existingProduct = await ProductModel.findOne({
      name: updatedData.name,
      _id: { $ne: id },
    });

    if (existingProduct) {
      throw new ApiError(
        400,
        "Product name already exists. Please choose a different name.",
      );
    }
  }

  if (files) {
    await deleteProductImages(product);
    await uploadProductImages(product, files);
  }

  Object.assign(product, updatedData);

  await product.save();

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  return product;
};

const deleteProductService = async (id, session = null) => {
  const productQuery = ProductModel.findByIdAndDelete(id);

  if (session) {
    productQuery.session(session);
  }

  const product = await productQuery;

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  await deleteProductImages(product);

  return product;
};

const uploadProductImages = async (product, files) => {
  if (!files) {
    throw new ApiError(
      400,
      "No images were uploaded. Please upload at least one product cover image and one product image.",
    );
  }

  if (files.productCover && files.productCover.length > 0) {
    const productCoverFile = files.productCover[0];
    const productCoverUploadResult = await uploadToCloudinary(
      productCoverFile.buffer,
      "products/covers",
    );

    product.productCover = {
      image_url: productCoverUploadResult.secure_url,
      public_id: productCoverUploadResult.public_id,
    };
  }

  if (files.productImages && files.productImages.length > 0) {
    const productImagesUploadResults = await Promise.all(
      files.productImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/images"),
      ),
    );

    product.productImages = productImagesUploadResults.map((result) => {
      return {
        image_url: result.secure_url,
        public_id: result.public_id,
      };
    });
  }

  return product;
};

const deleteProductImages = async (product) => {
  const publicIds = [];

  if (product.productCover?.public_id) {
    publicIds.push(product.productCover.public_id);
  }

  if (product.productImages?.length > 0) {
    publicIds.push(...product.productImages.map((image) => image.public_id));
  }

  await Promise.all(
    publicIds.map((publicId) => deleteFromCloudinary(publicId)),
  );
};

module.exports = {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  deleteProductImages,
};
