const express = require("express");

const authenticate = require("../middlewares/authenticate");

const {
  addNewAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
} = require("../middlewares/validators/address.validator");

const validate = require("../middlewares/validators/validate");

const {
  getAddresses,
  addNewAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/address.controller");

const router = express.Router();

router
  .route("/")
  .get(authenticate, getAddresses)
  .post(authenticate, addNewAddressValidator, validate, addNewAddress);

router
  .route("/:addressId")
  .patch(authenticate, updateAddressValidator, validate, updateAddress)
  .delete(authenticate, deleteAddressValidator, validate, deleteAddress);

module.exports = router;
