const express = require("express");
const {
  connectWallet,
  disconnectWallet,
  requireSign,
  getAllAccounts,
  getConnectedAccounts,
} = require("../Controller/AccountController");
const router = express.Router();

// Route to connect wallet
router.post("/connect", requireSign, connectWallet);

// Route to disconnect wallet
router.post("/disconnect", requireSign, disconnectWallet);

router.get("/get-account", requireSign, getAllAccounts);

router.get("/get-connect-account", requireSign, getConnectedAccounts);

module.exports = router;
