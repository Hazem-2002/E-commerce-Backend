const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const { doubleCsrfProtection } = require("../config/csrf");

const uploadSingle = require("../middlewares/upload/uploadSingle");

const {
  createBrandValidator,
  getBrandsValidator,
  getBrandByIdValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../middlewares/validators/brand.validator");
const validate = require("../middlewares/validators/validate");

const {
  getBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require("../controllers/brand.controller");

const router = express.Router();

router
  .route("/")
  .get(getBrandsValidator, validate, getBrands)
  .post(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    uploadSingle("image", true),
    createBrandValidator,
    validate,
    createBrand,
  );

router
  .route("/:id")
  .get(getBrandByIdValidator, validate, getBrandById)
  .patch(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    uploadSingle("image", false),
    updateBrandValidator,
    validate,
    updateBrand,
  )
  .delete(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    deleteBrandValidator,
    validate,
    deleteBrand,
  );

module.exports = router;
