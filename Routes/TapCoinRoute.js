const express = require("express");
const { requireSign, addCoinTap } = require("../Controller/TapCoinController");

const router = express.Router();

// Add coin on tap
router.post("/add", requireSign, addCoinTap);

module.exports = router;
