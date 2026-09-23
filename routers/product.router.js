const express = require("express");

const reviewRouter = require("./review.router");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const parseJsonFields = require("../middlewares/parseJsonFields");

const uploadFields = require("../middlewares/upload/uploadFields");

const {
  createProductValidators,
  getProductsValidators,
  getProductByIdValidators,
  updateProductValidators,
  deleteProductValidators,
} = require("../middlewares/validators/product.validator");

const validate = require("../middlewares/validators/validate");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const router = express.Router();

router.use("/:productId/reviews", reviewRouter);

router
  .route("/")
  .get(getProductsValidators, validate, getProducts)
  .post(
    authenticate,
    authorize("super-admin", "admin"),
    uploadFields(
      [
        { name: "productCover", maxCount: 1 },
        { name: "productImages", maxCount: 5 },
        { name: "variantsImages", maxCount: 20 },
      ],
      true,
      ["variantsImages"],
    ),
    parseJsonFields("variants", "subcategories", "tags"),
    createProductValidators,
    validate,
    createProduct,
  );

router
  .route("/:id")
  .get(getProductByIdValidators, validate, getProductById)
  .patch(
    authenticate,
    authorize("super-admin", "admin"),
    uploadFields(
      [
        { name: "productCover", maxCount: 1 },
        { name: "productImages", maxCount: 5 },
        { name: "variantsImages", maxCount: 20 },
      ],
      false,
    ),
    parseJsonFields("variants", "subcategories", "deletedImages", "tags"),
    updateProductValidators,
    validate,
    updateProduct,
  )
  .delete(
    authenticate,
    authorize("super-admin", "admin"),
    deleteProductValidators,
    validate,
    deleteProduct,
  );

module.exports = router;
