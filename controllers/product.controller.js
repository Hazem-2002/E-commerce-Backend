const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const ApiError = require("../utils/apiError");

const {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
} = require("../services/product.service");

const createProduct = asyncWrapper(async (req, res, next) => {
  const productData = req.body;

  const product = await createProductService(productData, req.files);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product created successfully",
    data: {
      product,
    },
  });
});

const getProducts = asyncWrapper(async (req, res, next) => {
  const { products, paginatedResults } = await getProductsService(req.query);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: {
      products,
    },
  });
});

const getProductById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const product = await getProductByIdService(id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      product,
    },
  });
});

const updateProduct = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if ((!req.body || Object.keys(req.body).length === 0) && !req.files) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const updatedProduct = await updateProductService(id, req.body, req.files);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product updated successfully",
    data: {
      product: updatedProduct,
    },
  });
});

const deleteProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const product = await deleteProductService(id);

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
