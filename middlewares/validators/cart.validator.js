const {
  mongoIdRule,
  cartItemVariantsRule,
  quantityRule,
} = require("./common/validationRules");

const addToCartValidators = [
  mongoIdRule("productId", "Product ID"),
  cartItemVariantsRule("variants", "Product Variants").optional(),
  quantityRule("quantity", "Product Quantity").optional(),
];

const updateCartItemValidators = [
  mongoIdRule("productId", "Product ID"),
  mongoIdRule("variantId", "Product Variant ID").optional(),
];

const removeFromCartValidators = [
  mongoIdRule("productId", "Product ID"),
  mongoIdRule("variantId", "Product Variant ID").optional(),
];

module.exports = {
  addToCartValidators,
  updateCartItemValidators,
  removeFromCartValidators,
};
