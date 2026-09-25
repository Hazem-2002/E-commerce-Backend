const UsersModel = require("../../models/users.model");

const {
  mongoIdRule,
  nameRule,
  phoneRule,
  emailRule,
} = require("./common/validationRules");

const getUserByIdValidator = [mongoIdRule("userId", "User ID")];

const getUserReviewsValidator = [mongoIdRule("userId", "User ID")];

const getUserWishlistValidator = [mongoIdRule("userId", "User ID")];

const getUserOrdersValidator = [mongoIdRule("userId", "User ID")];

const updateUserValidator = [
  mongoIdRule("userId", "User ID"),
  nameRule("name", "User name", 3, 50).optional(),
  phoneRule("phone", "User phone").optional(),
  emailRule("email", "User email")
    .bail()
    .custom(async (email, { req }) => {
      const existingUser = req.params.userId
        ? await UsersModel.findOne({
            _id: { $ne: req.params.userId },
            email,
          })
        : await UsersModel.findOne({ email });

      if (existingUser) {
        return Promise.reject(
          new ApiError(
            400,
            "Email already in use. Please choose a different email address.",
          ),
        );
      }
    })
    .optional(),
];

const updateMeValidator = [
  nameRule("name", "User name", 3, 50).optional(),
  phoneRule("phone", "User phone").optional(),
  emailRule("email", "User email")
    .bail()
    .custom(async (email, { req }) => {
      const existingUser = req.params.userId
        ? await UsersModel.findOne({
            _id: { $ne: req.params.userId },
            email,
          })
        : await UsersModel.findOne({ email });

      if (existingUser) {
        return Promise.reject(
          new ApiError(
            400,
            "Email already in use. Please choose a different email address.",
          ),
        );
      }
    })
    .optional(),
];

const deleteUserValidator = [mongoIdRule("userId", "User ID")];

module.exports = {
  getUserByIdValidator,
  getUserReviewsValidator,
  getUserWishlistValidator,
  getUserOrdersValidator,
  updateUserValidator,
  updateMeValidator,
  deleteUserValidator,
};
