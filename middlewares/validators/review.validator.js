const ProductModel = require("../../models/product.model");
const ApiError = require("../../utils/apiError");

const {
  mongoIdRule,
  ratingRule,
  commentRule,
} = require("./common/validationRules");

const createReviewValidator = [
  mongoIdRule("productId")
    .bail()
    .custom(async (value) => {
      const product = await ProductModel.exists({ _id: value });

      if (!product) {
        return Promise.reject(
          new ApiError(404, "The product with the given ID does not exist"),
        );
      }
    })
    .bail({ level: "request" }),
  ratingRule("Rating").bail({ level: "request" }),
  commentRule("Comment").bail({ level: "request" }).optional(),
];

module.exports = {
  createReviewValidator,
};
