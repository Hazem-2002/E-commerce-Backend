const { body, check } = require("express-validator");

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ApiError = require("../../../utils/apiError");

const UsersModel = require("../../../models/users.model");
const CategoryModel = require("../../../models/category.model");
const SubcategoryModel = require("../../../models/subcategory.model");
const BrandModel = require("../../../models/brand.madel");
const ProductModel = require("../../../models/product.model");

const nameRule = (fieldName = "name", typeName = "Name", min = 3, max = 50) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isLength({ min: min, max: max })
    .withMessage(
      `${typeName} must be between ${min} and ${max} characters long`,
    )
    .bail({ level: "request" });

const descriptionRule = (
  fieldName = "description",
  typeName = "Description",
  min = 10,
  max = 200,
) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isLength({ min: min, max: max })
    .withMessage(
      `${typeName} must be between ${min} and ${max} characters long`,
    )
    .bail({ level: "request" });

const phoneRule = (fieldName = "phone", typeName = "Phone") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
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
    .withMessage(
      `${typeName} must be a valid phone number in the specified format`,
    )
    .bail({ level: "request" });

const emailRule = (fieldName = "email", typeName = "Email") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .trim()
    .isEmail()
    .withMessage(`${typeName} must be a valid email address`)
    .bail({ level: "request" });

const passwordRule = (fieldName = "password", typeName = "Password") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isLength({ min: 6 })
    .withMessage(`${typeName} must be at least 6 characters long`)
    .bail({ level: "request" });

const currentPasswordRule = (
  fieldName = "currentPassword",
  typeName = "Current Password",
) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .custom(async (value, { req }) => {
      const user = await UsersModel.findById(req.user._id).select("+password");

      if (!user) {
        return Promise.reject(
          new ApiError(404, "No user found with the provided ID."),
        );
      }

      const isMatch = await bcrypt.compare(value, user.password);
      if (!isMatch) {
        return Promise.reject(
          new ApiError(
            400,
            `${typeName} is incorrect. Please provide the correct current password.`,
          ),
        );
      }

      req.user = user;

      return true;
    })
    .bail({ level: "request" });

const confirmPasswordRule = (
  fieldName = "confirmPassword",
  passwordField = "password",
  typeName = "Confirm Password",
) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body[passwordField]) {
        return Promise.reject(
          new ApiError(
            400,
            `${typeName} does not match the ${passwordField}. Please ensure both fields are identical.`,
          ),
        );
      }
      return true;
    })
    .bail({ level: "request" });

const roleRule = (fieldName = "role", typeName = "Role") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .trim()
    .isIn(["user", "admin", "super-admin"])
    .withMessage(`${typeName} must be either 'user', 'admin', or 'super-admin'`)
    .bail({ level: "request" });

const otpRule = (fieldName = "otp", typeName = "OTP") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage(`${typeName} must be a 6-digit number`)
    .bail({ level: "request" });

const mongoIdRule = (fieldName = "id", typeName = "ID") =>
  check(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isMongoId()
    .withMessage(`${typeName} must be a valid MongoDB ObjectId`)
    .bail({ level: "request" });

const mongoIdArrayRule = (fieldName, typeName) =>
  body(fieldName)
    .isArray({ min: 0 })
    .withMessage(`${typeName} must be an array of MongoDB ObjectIds`)
    .bail()
    .custom((ids) => {
      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return Promise.reject(
            new ApiError(
              400,
              `${typeName} contains an invalid MongoDB ObjectId: ${id}`,
            ),
          );
        }
      }
      return true;
    })
    .bail({ level: "request" });

const categoryIdRule = (fieldName = "category", typeName = "Category") =>
  mongoIdRule(fieldName, typeName)
    .bail()
    .custom(async (categoryId) => {
      const categoryExists = await CategoryModel.findById(categoryId);
      if (!categoryExists) {
        return Promise.reject(
          new ApiError(
            400,
            `${typeName} with ID ${categoryId} does not exist.`,
          ),
        );
      }
    })
    .bail({ level: "request" });

const subcategoryIdRule = (
  fieldName = "subcategories",
  typeName = "Subcategories",
) =>
  mongoIdArrayRule(fieldName, typeName)
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
            new ApiError(
              400,
              `One or more subcategories do not exist. Please provide valid subcategory IDs.`,
            ),
          );
        }

        // Check if subcategories belong to the specified category
        // If category is not provided in the request body, fetch it from the product being updated
        if (!req.body.category && req.params.id) {
          const product = await ProductModel.findById(req.params.id)
            .select("category")
            .lean();

          if (!product) {
            return Promise.reject(
              new ApiError(
                404,
                "Product not found. Please provide a valid product ID.",
              ),
            );
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
              "One or more subcategories do not belong to the specified category. Please ensure that all subcategories are associated with the correct category.",
            ),
          );
        }
      }
      return true;
    })
    .bail({ level: "request" });

const brandIdRule = (fieldName = "brand", typeName = "Brand") =>
  mongoIdRule(fieldName, typeName)
    .bail()
    .custom(async (brandId) => {
      const brandExists = await BrandModel.findById(brandId);
      if (!brandExists) {
        return Promise.reject(
          new ApiError(400, `${typeName} with ID ${brandId} does not exist.`),
        );
      }
    })
    .bail({ level: "request" });

const quantityRule = (fieldName = "quantity", typeName = "Quantity") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isInt({ gt: 0 })
    .withMessage(`${typeName} must be a positive integer`)
    .bail({ level: "request" });

const priceRule = (fieldName = "price", typeName = "Price") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isFloat({ gt: 0 })
    .withMessage(`${typeName} must be a positive number`)
    .bail({ level: "request" });

const priceAfterDiscountRule = (
  fieldName = "priceAfterDiscount",
  typeName = "Price after discount",
) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isFloat({ gt: 0 })
    .withMessage(`${typeName} must be a positive number`)
    .bail()
    .custom((value, { req }) => {
      if (value >= req.body.price) {
        return Promise.reject(
          new ApiError(
            400,
            `${typeName} must be less than the original price. Please provide a valid discounted price.`,
          ),
        );
      }
      return true;
    })
    .bail({ level: "request" });

const colorsRule = (fieldName = "colors", typeName = "Colors") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} are required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isArray({ min: 1 })
    .withMessage(`${typeName} must be an array with at least one color`)
    .bail()
    .custom((colors, { req }) => {
      for (const color of colors) {
        if (!color.hex || !color.quantity) {
          return Promise.reject(
            new ApiError(
              400,
              `${typeName} must contain both 'hex' and 'quantity' fields for each color.`,
            ),
          );
        }
        if (
          color.color &&
          (typeof color.color !== "string" || color.color.trim() === "")
        ) {
          return Promise.reject(
            new ApiError(
              400,
              `'color' field in each color of ${typeName} must be a non-empty string if provided.`,
            ),
          );
        }
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.hex)) {
          return Promise.reject(
            new ApiError(
              400,
              `'hex' field in each color of ${typeName} must be a valid hex color code.`,
            ),
          );
        }
        if (!Number.isInteger(color.quantity) || color.quantity < 0) {
          return Promise.reject(
            new ApiError(
              400,
              `'quantity' field in each color of ${typeName} must be a non-negative integer.`,
            ),
          );
        }
      }

      if (!req.body.quantity) {
        return Promise.reject(
          new ApiError(
            400,
            `${typeName} validation requires the product quantity to be specified. Please provide the product quantity.`,
          ),
        );
      }

      const totalQuantity = colors.reduce(
        (sum, color) => sum + color.quantity,
        0,
      );

      if (totalQuantity !== +req.body.quantity) {
        return Promise.reject(
          new ApiError(
            400,
            `The total quantity of all colors (${totalQuantity}) does not match the product quantity (${req.body.quantity}). Please ensure that the sum of color quantities equals the product quantity.`,
          ),
        );
      }

      return true;
    })
    .bail({ level: "request" });

const ratingRule = (fieldName = "rating", typeName = "Rating") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isFloat({ min: 1, max: 5 })
    .withMessage(`${typeName} must be between 1 and 5`)
    .bail({ level: "request" });

const ratingsAverageRule = (
  fieldName = "ratingsAverage",
  typeName = "Ratings Average",
) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isFloat({ min: 1, max: 5 })
    .withMessage(`${typeName} must be between 1 and 5`)
    .bail({ level: "request" });

const ratingsQuantityRule = (
  fieldName = "ratingsQuantity",
  typeName = "Ratings Quantity",
) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isInt({ min: 0 })
    .withMessage(`${typeName} must be a non-negative integer`)
    .bail({ level: "request" });

const isFeaturedRule = (fieldName = "isFeatured", typeName = "Is Featured") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isBoolean()
    .withMessage(`${typeName} must be a boolean value`)
    .bail({ level: "request" });

const soldRule = (fieldName = "sold", typeName = "Sold") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isInt({ min: 0 })
    .withMessage(`${typeName} must be a non-negative integer`)
    .bail({ level: "request" });

const commentRule = (fieldName = "comment", typeName = "Comment") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage(`${typeName} must be at least 1 character long`)
    .bail({ level: "request" });

const limitFieldsRule = (fieldName = "fields", typeName = "Limit Fields") =>
  check(fieldName)
    .optional()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .custom((value) => {
      // Check All is Exclusive or Inclusive
      const fields = value.split(",").map((field) => field.trim());

      const hasInclusion = fields.some((field) => !field.startsWith("-"));
      const hasExclusion = fields.some((field) => field.startsWith("-"));

      if (hasInclusion && hasExclusion) {
        return Promise.reject(
          new ApiError(
            400,
            `${typeName} cannot contain both inclusive and exclusive fields. Please provide either only inclusive fields or only exclusive fields.`,
          ),
        );
      }

      return true;
    })
    .bail({ level: "request" });

const addressFieldRule = (fieldName, typeName, minLength = 2, maxLength = 50) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(
      `${typeName} must be between ${minLength} and ${maxLength} characters long`,
    )
    .bail()
    .matches(/^[A-Za-z\s]+$/)
    .withMessage(`${typeName} must contain only letters and spaces`)
    .bail({ level: "request" });

const addressNumberFieldRule = (fieldName, typeName, min = 1, max = 9999) =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isInt({ min, max })
    .withMessage(`${typeName} must be a number`)
    .bail({ level: "request" });

const postalCodeRule = (fieldName = "postalCode", typeName = "Postal code") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isPostalCode("any")
    .withMessage(`${typeName} must be a valid postal code`)
    .bail({ level: "request" });

const discountRule = (fieldName = "discount", typeName = "Discount") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isFloat({ min: 1, max: 100 })
    .withMessage(`${typeName} must be a number between 1 and 100`)
    .bail({ level: "request" });

const dateRule = (fieldName = "date", typeName = "Date") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isISO8601()
    .withMessage(`${typeName} must be a valid ISO 8601 date`)
    .bail({ level: "request" });

const codeRule = (fieldName = "code", typeName = "Code") =>
  body(fieldName)
    .exists()
    .withMessage(`${typeName} is required`)
    .bail()
    .notEmpty()
    .withMessage(`${typeName} cannot be empty`)
    .bail()
    .isString()
    .withMessage(`${typeName} must be a string`)
    .bail()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage(`${typeName} must be between 3 and 30 characters`)
    .bail()
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      `${typeName} must contain only uppercase letters and numbers without spaces or special characters`,
    )
    .bail()
    .customSanitizer((value) => value.toUpperCase())
    .bail({ level: "request" });

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
  ratingRule,
  ratingsAverageRule,
  ratingsQuantityRule,
  isFeaturedRule,
  soldRule,
  commentRule,
  limitFieldsRule,
  addressFieldRule,
  addressNumberFieldRule,
  postalCodeRule,
  codeRule,
  discountRule,
  dateRule,
};
