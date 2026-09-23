const ntc = require("ntcjs");

const normalizeVariantColors = (productData) => {
  productData.variants.forEach((variant) => {
    if (variant.color && variant.color.hex) {
      const [, colorName] = ntc.name(variant.color.hex);

      if (colorName === "Invalid Color") {
        throw new ApiError(400, `Invalid color: ${variant.color.color}`);
      }

      variant.color.color = colorName;
    }
  });

  return productData.variants;
};

module.exports = normalizeVariantColors;
