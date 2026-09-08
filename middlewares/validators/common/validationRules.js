const { body, check } = require("express-validator");

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ApiError = require("../../../utils/apiError");

const UsersModel = require("../../../models/users.model");
const CategoryModel = require("../../../models/category.model");
const SubcategoryModel = require("../../../models/subcategory.model");
const BrandModel = require("../../../models/brand.madel");
const ProductModel = require("../../../models/product.model");

const nameRule = (fieldName, min = 3, max = 50) =>
  body("name")
    .exists()
    .withMessage(`${fieldName} name is required`)
    .bail()
    .notEmpty()
    .withMessage(`${fieldName} name cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${fieldName} name must be a string`)
    .bail()
    .trim()
    .isLength({ min: min, max: max })
    .withMessage(
      `${fieldName} name must be between ${min} and ${max} characters long`,
    );

const descriptionRule = (fieldName, min = 10, max = 200) =>
  body("description")
    .exists()
    .withMessage(`${fieldName} description is required`)
    .bail()
    .notEmpty()
    .withMessage(`${fieldName} description cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${fieldName} description must be a string`)
    .bail()
    .trim()
    .isLength({ min: min, max: max })
    .withMessage(
      `${fieldName} description must be between ${min} and ${max} characters long`,
    );

const phoneRule = () =>
  body("phone")
    .exists()
    .withMessage("Phone is required")
    .bail()
    .notEmpty()
    .withMessage("Phone cannot be empty")
    .bail()
    .trim()
    .isMobilePhone([
      "ar-EG",
      "ar-SA",
      "ar-LB",
      "ar-JO",
      "ar-KW",
      "ar-QA",
      "ar-BH",
      "ar-AE",
    ])
    .withMessage("Please enter a valid phone number");

const emailRule = () =>
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address");
    
const passwordRule = (fieldName = "password") =>
  body(fieldName)
    .exists()
    .withMessage(`Password is required`)
    .bail()
    .notEmpty()
    .withMessage(`Password cannot be empty`)
    .bail()
    .isLength({ min: 6 })
    .withMessage(`Password must be at least 6 characters long`);

const currentPasswordRule = (fieldName = "currentPassword") =>
  body(fieldName)
    .exists()
    .withMessage(`Current Password is required`)
    .bail()
    .notEmpty()
    .withMessage(`Current Password cannot be empty`)
    .bail()
    .custom(async (value, { req }) => {
      const user = await UsersModel.findById(req.user._id).select("+password");

      if (!user) {
        return Promise.reject(new ApiError(404, "User not found"));
      }

      const isMatch = await bcrypt.compare(value, user.password);
      if (!isMatch) {
        return Promise.reject(
          new ApiError(400, "Current password is incorrect"),
        );
      }

      req.user = user;

      return true;
    });

const confirmPasswordRule = (
  fieldName = "confirmPassword",
  passwordField = "password",
) =>
  body(fieldName)
    .exists()
    .withMessage(`Confirm Password is required`)
    .bail()
    .notEmpty()
    .withMessage(`Confirm Password cannot be empty`)
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body[passwordField]) {
        return Promise.reject(
          new ApiError(400, `Confirm Password does not match`),
        );
      }
      return true;
    });

const roleRule = () =>
  body("role")
    .exists()
    .withMessage("Role is required")
    .bail()
    .trim()
    .isIn(["user", "admin", "super-admin"])
    .withMessage("Role must be either 'user', 'admin', or 'super-admin'");

const otpRule = () =>
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .bail()
    .isString()
    .withMessage("OTP must be a string")
    .bail()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be a 6-digit number");

const mongoIdRule = (fieldName) =>
  check(fieldName)
    .exists()
    .withMessage(`${fieldName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${fieldName} cannot be empty`)
    .bail()
    .isMongoId()
    .withMessage(`${fieldName} must be a valid MongoDB ObjectId`);

const mongoIdArrayRule = (fieldName) =>
  body(fieldName)
    .isArray({ min: 0 })
    .withMessage(`${fieldName} must be an array`)
    .bail()
    .custom((ids) => {
      if (!Array.isArray(ids)) {
        return Promise.reject(
          new ApiError(400, `${fieldName} must be an array`),
        );
      }

      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return Promise.reject(
            new ApiError(
              400,
              `${fieldName} must contain valid MongoDB ObjectIds`,
            ),
          );
        }
      }
      return true;
    });

const categoryIdRule = (fieldName) =>
  mongoIdRule(fieldName)
    .bail()
    .custom(async (categoryId) => {
      const categoryExists = await CategoryModel.findById(categoryId);
      if (!categoryExists) {
        return Promise.reject(
          new ApiError(400, `Category with ID ${categoryId} does not exist`),
        );
      }
    });

const subcategoryIdRule = (fieldName) =>
  mongoIdArrayRule(fieldName)
    .bail()
    .customSanitizer((subcategories) => {
      return [...new Set(subcategories.map(String))];
    })
    .bail()
    .custom(async (subcategories, { req }) => {
      // Check if subcategories exist
      if (subcategories && subcategories.length > 0) {
        const subcategoriesExist = await SubcategoryModel.find({
          _id: { $in: subcategories },
        });
        if (subcategoriesExist.length !== subcategories.length) {
          return Promise.reject(
            new ApiError(400, "One or more subcategories do not exist"),
          );
        }

        // Check if subcategories belong to the specified category
        // If category is not provided in the request body, fetch it from the product being updated
        if (!req.body.category && req.params.id) {
          const product = await ProductModel.findById(req.params.id)
            .select("category")
            .lean();

          if (!product) {
            return Promise.reject(new ApiError(404, "Product not found"));
          }

          req.body.category = product.category.toString();
        }

        const categoryId = req.body.category;
        const invalidSubcategories = subcategoriesExist.filter(
          (subcategory) => subcategory.category.toString() !== categoryId,
        );
        if (invalidSubcategories.length > 0) {
          return Promise.reject(
            new ApiError(
              400,
              "One or more subcategories do not belong to the specified category",
            ),
          );
        }
      }
      return true;
    });

const brandIdRule = (fieldName) =>
  mongoIdRule(fieldName)
    .bail()
    .custom(async (brandId) => {
      const brandExists = await BrandModel.findById(brandId);
      if (!brandExists) {
        return Promise.reject(
          new ApiError(400, `Brand with ID ${brandId} does not exist`),
        );
      }
    });

const quantityRule = (fieldName) =>
  body("quantity")
    .exists()
    .withMessage(`${fieldName} quantity is required`)
    .bail()
    .notEmpty()
    .withMessage(`${fieldName} quantity cannot be empty`)
    .bail()
    .isInt({ gt: 0 })
    .withMessage(`${fieldName} quantity must be a positive integer`);

const priceRule = (fieldName) =>
  body("price")
    .exists()
    .withMessage(`${fieldName} price is required`)
    .bail()
    .notEmpty()
    .withMessage(`${fieldName} price cannot be empty`)
    .bail()
    .isFloat({ gt: 0 })
    .withMessage(`${fieldName} price must be a positive number`);

const priceAfterDiscountRule = (fieldName) =>
  body("priceAfterDiscount")
    .optional()
    .notEmpty()
    .withMessage(`${fieldName} price after discount cannot be empty`)
    .bail()
    .isFloat({ gt: 0 })
    .withMessage(`${fieldName} price after discount must be a positive number`);

const colorsRule = (fieldName) =>
  body("colors")
    .exists()
    .withMessage(`${fieldName} colors are required`)
    .bail()
    .notEmpty()
    .withMessage(`${fieldName} colors cannot be empty`)
    .bail()
    .isArray({ min: 1 })
    .withMessage(`${fieldName} colors must be an array with at least one color`)
    .bail()
    .custom((colors, { req }) => {
      for (const color of colors) {
        if (!color.hex || !color.quantity) {
          return Promise.reject(
            new Error(
              `${fieldName} color must have 'hex', and 'quantity' properties`,
            ),
          );
        }
        if (typeof color.color !== "string" || color.color.trim() === "") {
          return Promise.reject(
            new Error(`${fieldName} color 'color' must be a non-empty string`),
          );
        }
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.hex)) {
          return Promise.reject(
            new Error(
              `${fieldName} color 'hex' must be a valid hex color code`,
            ),
          );
        }
        if (!Number.isInteger(color.quantity) || color.quantity < 0) {
          return Promise.reject(
            new Error(
              `${fieldName} color 'quantity' must be a non-negative integer`,
            ),
          );
        }
      }

      if (!req.body.quantity) {
        return Promise.reject(
          new Error(`please provide ${fieldName} quantity`),
        );
      }

      const totalQuantity = colors.reduce(
        (sum, color) => sum + color.quantity,
        0,
      );

      if (totalQuantity !== +req.body.quantity) {
        return Promise.reject(
          new Error(
            `${fieldName} total color quantities (${totalQuantity}) must equal the product quantity (${req.body.quantity})`,
          ),
        );
      }

      return true;
    });

const ratingsAverageRule = (fieldName) =>
  body("ratingsAverage")
    .optional()
    .notEmpty()
    .withMessage(`${fieldName} ratingsAverage cannot be empty`)
    .bail()
    .isFloat({ min: 1, max: 5 })
    .withMessage(`${fieldName} ratingsAverage must be between 1 and 5`);

const ratingsQuantityRule = (fieldName) =>
  body("ratingsQuantity")
    .optional()
    .notEmpty()
    .withMessage(`${fieldName} ratingsQuantity cannot be empty`)
    .bail()
    .isInt({ min: 0 })
    .withMessage(`${fieldName} ratingsQuantity must be a non-negative integer`);

const isFeaturedRule = (fieldName) =>
  body("isFeatured")
    .optional()
    .notEmpty()
    .withMessage(`${fieldName} isFeatured cannot be empty`)
    .bail()
    .isBoolean()
    .withMessage(`${fieldName} isFeatured must be a boolean value`);

const soldRule = (fieldName) =>
  body("sold")
    .optional()
    .notEmpty()
    .withMessage(`${fieldName} sold cannot be empty`)
    .bail()
    .isInt({ min: 0 })
    .withMessage(`${fieldName} sold must be a non-negative integer`);

const limitFieldsRule = (fieldName) =>
  check("fields")
    .optional()
    .custom((value) => {
      // Check All is Exclusive or Inclusive
      const fields = value.split(",").map((field) => field.trim());

      const hasInclusion = fields.some((field) => !field.startsWith("-"));
      const hasExclusion = fields.some((field) => field.startsWith("-"));

      if (hasInclusion && hasExclusion) {
        return Promise.reject(
          new ApiError(
            400,
            `${fieldName} fields must be either all inclusive or all exclusive`,
          ),
        );
      }

      return true;
    });

module.exports = {
  nameRule,
  descriptionRule,
  phoneRule,
  emailRule,
  passwordRule,
  currentPasswordRule,
  confirmPasswordRule,
  roleRule,
  otpRule,
  mongoIdRule,
  mongoIdArrayRule,
  categoryIdRule,
  subcategoryIdRule,
  brandIdRule,
  quantityRule,
  priceRule,
  priceAfterDiscountRule,
  colorsRule,
  ratingsAverageRule,
  ratingsQuantityRule,
  isFeaturedRule,
  soldRule,
  limitFieldsRule,
};
