const {
  nameRule,
  descriptionRule,
  quantityRule,
  priceRule,
  priceAfterDiscountRule,
  colorsRule,
  mongoIdRule,
  limitFieldsRule,
  categoryIdRule,
  subcategoryIdRule,
  brandIdRule,
  ratingsAverageRule,
  ratingsQuantityRule,
  isFeaturedRule,
  soldRule,
} = require("./common/validationRules");

const createProductValidators = [
  nameRule("name", "Product name", 3, 100),
  descriptionRule("description", "Product description", 10, 200),
  quantityRule("quantity", "Product quantity"),
  priceRule("price", "Product price"),
  priceAfterDiscountRule(
    "priceAfterDiscount",
    "Product price after discount",
  ).optional(),
  colorsRule("colors", "Product colors"),
  categoryIdRule("category", "Product category"),
  subcategoryIdRule("subcategories", "Product subcategories").optional(),
  brandIdRule("brand", "Product brand"),
  ratingsAverageRule("ratingsAverage", "Product ratings average").optional(),
  ratingsQuantityRule("ratingsQuantity", "Product ratings quantity").optional(),
  isFeaturedRule("isFeatured", "Product featured status").optional(),
  soldRule("sold", "Product sold quantity").optional(),
];

const getProductsValidators = [limitFieldsRule("fields", "Product fields")];

const getProductByIdValidators = [mongoIdRule("id", "Product ID")];

const updateProductValidators = [
  mongoIdRule("id", "Product ID"),
  nameRule("name", "Product name", 3, 100).optional(),
  descriptionRule("description", "Product description", 10, 200).optional(),
  quantityRule("quantity", "Product quantity").optional(),
  priceRule("price", "Product price").optional(),
  priceAfterDiscountRule(
    "priceAfterDiscount",
    "Product price after discount",
  ).optional(),
  colorsRule("colors", "Product colors").optional(),
  categoryIdRule("category", "Product category").optional(),
  subcategoryIdRule("subcategories", "Product subcategories").optional(),
  brandIdRule("brand", "Product brand").optional(),
  ratingsAverageRule("ratingsAverage", "Product ratings average").optional(),
  ratingsQuantityRule("ratingsQuantity", "Product ratings quantity").optional(),
  isFeaturedRule("isFeatured", "Product featured status").optional(),
  soldRule("sold", "Product sold quantity").optional(),
];

const deleteProductValidators = [mongoIdRule("id", "Product ID")];

module.exports = {
  createProductValidators,
  getProductsValidators,
  getProductByIdValidators,
  updateProductValidators,
  deleteProductValidators,
};
