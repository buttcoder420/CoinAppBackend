const express = require("express");
const {
  requireSign,
  addCoinTap,
  getRemainingLimit,
  resetDailyLimit,
} = require("../Controller/TapCoinController");

const router = express.Router();

// Add coin on tap
router.post("/add", requireSign, addCoinTap);

// Get Remaining Limit Route
router.get("/coin/remaining-limit", requireSign, getRemainingLimit);

// Reset Daily Limit Route
router.post("/coin/reset-limit", requireSign, resetDailyLimit);

module.exports = router;
