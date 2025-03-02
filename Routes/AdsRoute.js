const express = require("express");
const { watchAd, requireSign } = require("../Controller/AdsController");
const router = express.Router();

router.post("/watch-ad", requireSign, watchAd);

module.exports = router;
