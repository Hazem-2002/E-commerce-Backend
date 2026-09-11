const {
  nameRule,
  mongoIdRule,
  limitFieldsRule,
} = require("./common/validationRules");

const createCategoryValidator = [nameRule("name", "Category name", 2, 50)];

const getCategoriesValidator = [limitFieldsRule("fields", "Category fields")];

const getCategoryByIdValidator = [mongoIdRule("id", "Category ID")];

const updateCategoryValidator = [
  mongoIdRule("id", "Category ID"),
  nameRule("name", "Category name", 2, 50).optional(),
];

const deleteCategoryValidator = [mongoIdRule("id", "Category ID")];

module.exports = {
  createCategoryValidator,
  getCategoriesValidator,
  getCategoryByIdValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
};
