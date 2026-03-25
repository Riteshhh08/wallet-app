const express = require("express");
const router = express.Router();
const validateClientId = require("../middleware/validateClientId");
const { createOrder, getOrder } = require("../controllers/ordersController");

router.post("/", validateClientId, createOrder);
router.get("/:order_id", validateClientId, getOrder);

module.exports = router;
