const express = require("express");
const router = express.Router();

const subcategoryRouter = require("./subcategory.router");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const {
  createCategoryValidator,
  getCategoriesValidator,
  getCategoryByIdValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../middlewares/validators/category.validator");

const validate = require("../middlewares/validators/validate");

const uploadSingle = require("../middlewares/upload/uploadSingle");

const authenticate = require("../middlewares/authenticate");

const authorize = require("../middlewares/authorize");

router.use("/:id/subcategories", subcategoryRouter);

router
  .route("/")
  .get(getCategoriesValidator, validate, getCategories)
  .post(
    authenticate,
    authorize("super-admin", "admin"),
    uploadSingle("image", true),
    createCategoryValidator,
    validate,
    createCategory,
  );

router
  .route("/:id")
  .get(getCategoryByIdValidator, validate, getCategoryById)
  .patch(
    authenticate,
    authorize("super-admin", "admin"),
    uploadSingle("image", false),
    updateCategoryValidator,
    validate,
    updateCategory,
  )
  .delete(
    authenticate,
    authorize("super-admin", "admin"),
    deleteCategoryValidator,
    validate,
    deleteCategory,
  );

module.exports = router;
