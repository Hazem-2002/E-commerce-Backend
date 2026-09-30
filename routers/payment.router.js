const express = require("express");

const authenticate = require("../middlewares/authenticate");

const {
  createPaymentIntention,
  handleTransactionProcessedCallback,
} = require("../controllers/payment.controller");

const router = express.Router();

router.route("/checkout").post(authenticate, createPaymentIntention);

router.route("/callback").post(handleTransactionProcessedCallback);

module.exports = router;
