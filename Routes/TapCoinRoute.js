const express = require("express");
const { requireSign, addCoin } = require("../Controller/TabCoinController");

const router = express.Router();

// Add coin on tap
router.post("/add", requireSign, addCoin);

module.exports = router;
