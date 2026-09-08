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
  nameRule("Product", 3, 100).bail({ level: "request" }),
  descriptionRule("Product", 10, 200).bail({ level: "request" }),
  quantityRule("Product").bail({ level: "request" }),
  priceRule("Product").bail({ level: "request" }),
  priceAfterDiscountRule("Product").bail({ level: "request" }),
  colorsRule("Product").bail({ level: "request" }),
  categoryIdRule("category").bail({ level: "request" }),
  subcategoryIdRule("subcategories").optional().bail({ level: "request" }),
  brandIdRule("brand").bail({ level: "request" }),
  ratingsAverageRule("Product").bail({ level: "request" }),
  ratingsQuantityRule("Product").bail({ level: "request" }),
  isFeaturedRule("Product").bail({ level: "request" }),
  soldRule("Product").bail({ level: "request" }),
];

const getProductsValidators = [
  limitFieldsRule("Products").bail({ level: "request" }),
];

const getProductByIdValidators = [mongoIdRule("id").bail({ level: "request" })];

const updateProductValidators = [
  mongoIdRule("id").bail({ level: "request" }),
  nameRule("Product", 3, 100).bail({ level: "request" }).optional(),
  descriptionRule("Product", 10, 200).bail({ level: "request" }).optional(),
  quantityRule("Product").bail({ level: "request" }).optional(),
  priceRule("Product").bail({ level: "request" }).optional(),
  priceAfterDiscountRule("Product").bail({ level: "request" }).optional(),
  colorsRule("Product").bail({ level: "request" }).optional(),
  categoryIdRule("category").bail({ level: "request" }).optional(),
  subcategoryIdRule("subcategories").bail({ level: "request" }).optional(),
  brandIdRule("brand").bail({ level: "request" }).optional(),
  ratingsAverageRule("Product").bail({ level: "request" }).optional(),
  ratingsQuantityRule("Product").bail({ level: "request" }).optional(),
  isFeaturedRule("Product").bail({ level: "request" }).optional(),
  soldRule("Product").bail({ level: "request" }).optional(),
];

const deleteProductValidators = [mongoIdRule("id").bail({ level: "request" })];

module.exports = {
  createProductValidators,
  getProductsValidators,
  getProductByIdValidators,
  updateProductValidators,
  deleteProductValidators,
};
