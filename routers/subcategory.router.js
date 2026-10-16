const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const { doubleCsrfProtection } = require("../config/csrf");

const {
  createSubcategoryValidator,
  getSubcategoriesValidator,
  getSubcategoryByIdValidator,
  updateSubcategoryValidator,
  deleteSubcategoryValidator,
} = require("../middlewares/validators/subcategory.validator");

const validate = require("../middlewares/validators/validate");

const {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} = require("../controllers/subcategory.controller");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getSubcategoriesValidator, validate, getSubcategories)
  .post(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    createSubcategoryValidator,
    validate,
    createSubcategory,
  );

router
  .route("/:id")
  .get(getSubcategoryByIdValidator, validate, getSubcategoryById)
  .patch(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    updateSubcategoryValidator,
    validate,
    updateSubcategory,
  )
  .delete(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    deleteSubcategoryValidator,
    validate,
    deleteSubcategory,
  );

module.exports = router;
