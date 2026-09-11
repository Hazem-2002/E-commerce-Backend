const {
  nameRule,
  mongoIdRule,
  limitFieldsRule,
} = require("./common/validationRules");

const createSubcategoryValidator = [
  nameRule("name", "Subcategory name", 2, 50),
  mongoIdRule("category", "Category ID"),
];

const getSubcategoriesValidator = [
  mongoIdRule("id", "Category ID").optional(),
  limitFieldsRule("fields", "Subcategory fields").optional(),
];

const getSubcategoryByIdValidator = [mongoIdRule("id", "Subcategory ID")];

const updateSubcategoryValidator = [
  mongoIdRule("id", "Subcategory ID"),
  nameRule("name", "Subcategory name", 2, 50).optional(),
  mongoIdRule("category", "Category ID").optional(),
];

const deleteSubcategoryValidator = [mongoIdRule("id", "Subcategory ID")];

module.exports = {
  createSubcategoryValidator,
  getSubcategoriesValidator,
  getSubcategoryByIdValidator,
  updateSubcategoryValidator,
  deleteSubcategoryValidator,
};
