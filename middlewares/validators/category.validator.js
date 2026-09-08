const {
  nameRule,
  mongoIdRule,
  limitFieldsRule,
} = require("./common/validationRules");

const createCategoryValidator = [
  nameRule("category", 2, 50).bail({ level: "request" }),
];

const getCategoriesValidator = [
  limitFieldsRule("categories").bail({ level: "request" }),
];

const getCategoryByIdValidator = [mongoIdRule("id").bail({ level: "request" })];

const updateCategoryValidator = [
  mongoIdRule("id").bail({ level: "request" }),
  nameRule("category", 2, 50).optional().bail({ level: "request" }),
];

const deleteCategoryValidator = [mongoIdRule("id").bail({ level: "request" })];

module.exports = {
  createCategoryValidator,
  getCategoriesValidator,
  getCategoryByIdValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
};
