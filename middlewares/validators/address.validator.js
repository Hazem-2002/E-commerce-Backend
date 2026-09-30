const {
  mongoIdRule,
  nameRule,
  phoneRule,
  emailRule,
  addressFieldRule,
  addressNumberFieldRule,
  postalCodeRule,
} = require("./common/validationRules");

const addNewAddressValidator = [
  nameRule("title", "Address title"),
  nameRule("first_name", "User first name"),
  nameRule("last_name", "User last name"),
  phoneRule("phone_number", "User phone number"),
  emailRule("email", "User email"),
  addressFieldRule("country", "User country", 2, 50),
  addressFieldRule("city", "User city", 2, 50),
  addressFieldRule("district", "User district", 2, 50),
  addressFieldRule("street", "User street", 2, 100),
  addressNumberFieldRule("building", " User building number", 1, 999),
  addressNumberFieldRule("floor", "User floor number", 1, 999),
  addressNumberFieldRule("apartment", "User apartment number", 1, 999),
  postalCodeRule("postal_code", "User postal code"),
];

const updateAddressValidator = [
  mongoIdRule("addressId", "Address ID"),
  nameRule("title", "Address title").optional(),
  nameRule("first_name", "User first name").optional(),
  nameRule("last_name", "User last name").optional(),
  phoneRule("phone_number", "User phone number").optional(),
  emailRule("email", "User email").optional(),
  addressFieldRule("country", "User country", 2, 50).optional(),
  addressFieldRule("city", "User city", 2, 50).optional(),
  addressFieldRule("district", "User district", 2, 50).optional(),
  addressFieldRule("street", "User street", 2, 100).optional(),
  addressNumberFieldRule(
    "building",
    " User building number",
    1,
    999,
  ).optional(),
  addressNumberFieldRule("floor", "User floor number", 1, 999).optional(),
  addressNumberFieldRule(
    "apartment",
    "User apartment number",
    1,
    999,
  ).optional(),
  postalCodeRule("postal_code", "User postal code").optional(),
];

const deleteAddressValidator = [mongoIdRule("addressId", "Address ID")];

module.exports = {
  addNewAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
};
