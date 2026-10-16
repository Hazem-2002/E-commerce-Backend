const express = require("express");

const authenticate = require("../middlewares/authenticate");
const { doubleCsrfProtection } = require("../config/csrf");

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
  .post(
    authenticate,
    doubleCsrfProtection,
    addNewAddressValidator,
    validate,
    addNewAddress,
  );

router
  .route("/:addressId")
  .patch(
    authenticate,
    doubleCsrfProtection,
    updateAddressValidator,
    validate,
    updateAddress,
  )
  .delete(
    authenticate,
    doubleCsrfProtection,
    deleteAddressValidator,
    validate,
    deleteAddress,
  );

module.exports = router;
