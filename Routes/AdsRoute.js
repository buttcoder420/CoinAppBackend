const express = require("express");
const {
  watchAd,
  requireSign,
  IsAdmin,
  getUserAdStats,
} = require("../Controller/AdsController");
const router = express.Router();

router.post("/watch-ad", requireSign, watchAd);

router.get("/user-ad-stats", requireSign, IsAdmin, getUserAdStats);

module.exports = router;
