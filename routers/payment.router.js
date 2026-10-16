const express = require("express");

const authenticate = require("../middlewares/authenticate");
const { doubleCsrfProtection } = require("../config/csrf");

const {
  createPaymentIntention,
  handleTransactionProcessedCallback,
} = require("../controllers/payment.controller");

const router = express.Router();

router
  .route("/checkout")
  .post(authenticate, doubleCsrfProtection, createPaymentIntention);

router.route("/callback").post(handleTransactionProcessedCallback);

module.exports = router;
