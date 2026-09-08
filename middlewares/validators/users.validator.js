const UsersModel = require("../../models/users.model");

const {
  mongoIdRule,
  nameRule,
  phoneRule,
  emailRule,
} = require("./common/validationRules");

const getUserByIdValidator = [mongoIdRule("id").bail({ level: "request" })];

const updateUserValidator = [
  mongoIdRule("id").bail({ level: "request" }),
  nameRule("User", 3, 50).bail({ level: "request" }).optional(),
  phoneRule().bail({ level: "request" }).optional(),
  emailRule()
    .bail()
    .custom(async (email, { req }) => {
      const existingUser = req.params.id
        ? await UsersModel.findOne({
            _id: { $ne: req.params.id },
            email,
          })
        : await UsersModel.findOne({ email });

      if (existingUser) {
        return Promise.reject(new ApiError(400, "Email already in use"));
      }
    })
    .bail({ level: "request" })
    .optional(),
];

const deleteUserValidator = [mongoIdRule("id").bail({ level: "request" })];

module.exports = {
  getUserByIdValidator,
  updateUserValidator,
  deleteUserValidator,
};
