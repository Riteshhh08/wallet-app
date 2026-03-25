const express = require("express");
const router = express.Router();
const { creditWallet, debitWallet } = require("../controllers/adminController");

router.post("/wallet/credit", creditWallet);
router.post("/wallet/debit", debitWallet);

module.exports = router;
