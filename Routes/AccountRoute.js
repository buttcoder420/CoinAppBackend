const express = require("express");
const {
  connectWallet,
  disconnectWallet,
  requireSign,
  getAllAccounts,
  getConnectedAccounts,
  setAccountConnectionStatus,
} = require("../Controller/AccountController");
const router = express.Router();

// Route to connect wallet
router.post("/connect", requireSign, connectWallet);

// Route to disconnect wallet
router.post("/disconnect", requireSign, disconnectWallet);

router.get("/get-account", requireSign, getAllAccounts);

router.get("/get-connect-account", requireSign, getConnectedAccounts);

router.put("/account/:accountId", requireSign, setAccountConnectionStatus);

module.exports = router;
