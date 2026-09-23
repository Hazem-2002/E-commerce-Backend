const {
  nameRule,
  descriptionRule,
  quantityRule,
  skuRule,
  tagsRule,
  priceRule,
  priceAfterDiscountRule,
  variantsRule,
  deletedImagesRule,
  mongoIdRule,
  limitFieldsRule,
  categoryIdRule,
  subcategoryIdRule,
  brandIdRule,
  isFeaturedRule,
  isActiveRule,
} = require("./common/validationRules");

const createProductValidators = [
  nameRule("name", "Product name", 3, 100),
  descriptionRule("shortDescription", "Product short description", 10, 200),
  descriptionRule("description", "Product description", 10, 200),
  quantityRule("quantity", "Product quantity"),
  priceRule("price", "Product price"),
  priceAfterDiscountRule(
    "priceAfterDiscount",
    "Product price after discount",
  ).optional(),
  variantsRule("variants", "Product variants").optional(),
  tagsRule("tags", "Product tags"),
  skuRule("sku", "Product SKU"),
  categoryIdRule("category", "Product category"),
  subcategoryIdRule("subcategories", "Product subcategories").optional(),
  brandIdRule("brand", "Product brand"),
  isFeaturedRule("isFeatured", "Product featured status").optional(),
  isActiveRule("isActive", "Product active status").optional(),
];

const updateProductValidators = [
  mongoIdRule("id", "Product ID").optional(),
  nameRule("name", "Product name", 3, 100).optional(),
  descriptionRule(
    "shortDescription",
    "Product short description",
    10,
    200,
  ).optional(),
  descriptionRule("description", "Product description", 10, 200).optional(),
  quantityRule("quantity", "Product quantity").optional(),
  priceRule("price", "Product price").optional(),
  priceAfterDiscountRule(
    "priceAfterDiscount",
    "Product price after discount",
  ).optional(),
  variantsRule("variants", "Product variants").optional(),
  deletedImagesRule("deletedImages").optional(),
  tagsRule("tags", "Product tags").optional(),
  skuRule("sku", "Product SKU").optional(),
  categoryIdRule("category", "Product category").optional(),
  subcategoryIdRule("subcategories", "Product subcategories").optional(),
  brandIdRule("brand", "Product brand").optional(),
  isFeaturedRule("isFeatured", "Product featured status").optional(),
  isActiveRule("isActive", "Product active status").optional(),
];

const getProductsValidators = [limitFieldsRule("fields", "Product fields")];

const getProductByIdValidators = [mongoIdRule("id", "Product ID")];

const deleteProductValidators = [mongoIdRule("id", "Product ID")];

module.exports = {
  createProductValidators,
  getProductsValidators,
  getProductByIdValidators,
  updateProductValidators,
  deleteProductValidators,
};
