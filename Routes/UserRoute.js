const express = require("express");

const {
  loginController,
  registerController,
  requireSign,

  getUserBalance,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  convertAmountToCoins,
  getUserReferrals,
  getReferralLink,
} = require("../Controller/UserController");
const { IsAdmin } = require("../Controller/DailyRewardController");

const router = express.Router();

//Registration route
router.post("/register", registerController);

//Login Route
router.post("/login", loginController);

//get coin aount
router.get("/balance", requireSign, getUserBalance);
// Get all users (Admin only)
router.get("/all-users", requireSign, IsAdmin, getAllUsers);

// Get specific user details
router.get("/get-single/:id", requireSign, IsAdmin, getUserById);
// Update user (Admin only)
router.put("/update-user/:id", requireSign, IsAdmin, updateUser);

// Delete user (Admin only)
router.delete("/delete/:id", requireSign, IsAdmin, deleteUser);

router.post("/convert-coins", requireSign, convertAmountToCoins);

router.get("/referrals", requireSign, getUserReferrals);

router.get("/referral-link", requireSign, getReferralLink);

module.exports = router;
