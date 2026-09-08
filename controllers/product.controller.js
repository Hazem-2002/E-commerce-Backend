const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const ProductModel = require("../models/product.model");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");

const createProduct = asyncWrapper(async (req, res, next) => {
  const productData = req.body;

  // check if product with the same name already exists
  const existingProduct = await ProductModel.findOne({
    name: productData.name,
  });
  if (existingProduct) {
    return next(new ApiError(400, "Product already exists"));
  }

  // check if files are uploaded
  if (!req.files) {
    return next(new ApiError(400, "No files were uploaded."));
  }

  // Upload product cover
  if (req.files.productCover && req.files.productCover.length > 0) {
    const productCoverFile = req.files.productCover[0];
    const productCoverUploadResult = await uploadToCloudinary(
      productCoverFile.buffer,
      "products/covers",
    );
    productData.productCover = {
      image_url: productCoverUploadResult.secure_url,
      public_id: productCoverUploadResult.public_id,
    };
  }

  // Upload product images
  if (req.files.productImages && req.files.productImages.length > 0) {
    const productImagesUploadResults = await Promise.all(
      req.files.productImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/images"),
      ),
    );
    productData.productImages = productImagesUploadResults.map((result) => {
      return {
        image_url: result.secure_url,
        public_id: result.public_id,
      };
    });
  }

  const product = await ProductModel.create(productData);

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product created successfully",
    data: {
      product,
    },
  });
});

const getProducts = asyncWrapper(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(ProductModel.find(), req.query);

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
    return next(
      new ApiError(
        400,
        "Invalid page number. The requested page exceeds the total number of pages.",
      ),
    );
  }

  const products = await apiFeatures.query;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...apiFeatures.paginatedResults,
    data: {
      products,
    },
  });
});

const getProductById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const product = await ProductModel.findById(id)
    .populate({ path: "category", select: "name" })
    .populate({ path: "brand", select: "name" })
    .populate({ path: "subcategories", select: "name" });

  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      product,
    },
  });
});

const updateProduct = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const updatedData = req.body;

  if (!updatedData || Object.keys(updatedData).length === 0) {
    return next(new ApiError(400, "No data provided for update"));
  }

  const product = await ProductModel.findById(id);

  // check if product exists
  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  // Upload product cover if provided
  if (req.files.productCover && req.files.productCover.length > 0) {
    // Delete the old product cover from Cloudinary
    if (product.productCover && product.productCover.public_id) {
      await deleteFromCloudinary(product.productCover.public_id);
    }

    const productCoverFile = req.files.productCover[0];
    const productCoverUploadResult = await uploadToCloudinary(
      productCoverFile.buffer,
      "products/covers",
    );
    updatedData.productCover = {
      image_url: productCoverUploadResult.secure_url,
      public_id: productCoverUploadResult.public_id,
    };
  }

  // Upload product images if provided
  if (req.files.productImages && req.files.productImages.length > 0) {
    // Delete the old product images from Cloudinary
    if (product.productImages && product.productImages.length > 0) {
      await Promise.all(
        product.productImages.map((image) =>
          deleteFromCloudinary(image.public_id),
        ),
      );
    }

    const productImagesUploadResults = await Promise.all(
      req.files.productImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/images"),
      ),
    );
    updatedData.productImages = productImagesUploadResults.map((result) => {
      return {
        image_url: result.secure_url,
        public_id: result.public_id,
      };
    });
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    id,
    { $set: updatedData },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate({ path: "category", select: "name" })
    .populate({ path: "brand", select: "name" })
    .populate({ path: "subcategories", select: "name" });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product updated successfully",
    data: {
      product: updatedProduct,
    },
  });
});

const deleteProduct = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const product = await ProductModel.findByIdAndDelete(id);

  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  if (product.productCover && product.productCover.public_id) {
    await deleteFromCloudinary(product.productCover.public_id);
  }

  if (product.productImages && product.productImages.length > 0) {
    await Promise.all(
      product.productImages.map((image) =>
        deleteFromCloudinary(image.public_id),
      ),
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product deleted successfully",
    data: {
      product,
    },
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
