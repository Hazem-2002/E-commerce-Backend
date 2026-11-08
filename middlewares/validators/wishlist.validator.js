const { mongoIdRule } = require("./common/validationRules");

const toggleWishlistValidator = [mongoIdRule("productId", "Product ID")];
const addToWishlistValidator = [mongoIdRule("productId", "Product ID")];
const removeFromWishlistValidator = [mongoIdRule("productId", "Product ID")];

module.exports = {
  toggleWishlistValidator,
  addToWishlistValidator,
  removeFromWishlistValidator,
};
