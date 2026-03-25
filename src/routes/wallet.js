const express = require("express");
const router = express.Router();
const validateClientId = require("../middleware/validateClientId");
const { getBalance } = require("../controllers/walletController");

router.get("/balance", validateClientId, getBalance);

module.exports = router;
