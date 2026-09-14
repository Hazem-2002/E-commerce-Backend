const { mongoIdRule } = require("./common/validationRules");

const toggleWishlistValidator = [mongoIdRule("productId", "Product ID")];

module.exports = {
  toggleWishlistValidator,
};
