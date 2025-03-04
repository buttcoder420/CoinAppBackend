const { expressjwt: jwt } = require("express-jwt");
const AccountModel = require("../Models/AccountModel");
const UserRegisterModel = require("../Models/UserRegisterModel");
const CashOutModel = require("../Models/CashOutModel");
const requireSign = [
  jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
  }),
  (err, req, res, next) => {
    if (err && err.name === "UnauthorizedError") {
      return res.status(401).json({ message: "Invalid or missing token" });
    }
    next();
  },
];
const IsAdmin = async (req, res, next) => {
  try {
    const user = await UserRegisterModel.findById(req.auth._id);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied! Admin only." });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Controller to handle user cash-out request
const requestCashOut = async (req, res) => {
  try {
    const userId = req.auth?._id;
    const { accountId, coinAmount } = req.body;

    // Validate minimum amount
    if (!coinAmount || coinAmount < 1000) {
      return res
        .status(400)
        .json({ message: "Minimum 1000 coins required for cash-out." });
    }

    // Find user
    const user = await UserRegisterModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user has enough coins
    if (user.coin < coinAmount) {
      return res.status(400).json({ message: "Insufficient coin balance." });
    }

    // Deduct coins from user balance
    user.coin -= coinAmount;
    await user.save();

    // Create a new cash-out request
    const newCashOut = new CashOutModel({
      userId,
      accountId,
      coinAmount,
      status: "calculating",
    });

    await newCashOut.save();

    return res.status(201).json({
      message: "Cash-out request submitted successfully.",
      cashOutRequest: newCashOut,
    });
  } catch (error) {
    console.error("Cash-out request error:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

// Admin controller to manage all cash-out requests
const getAllCashOutRequests = async (req, res) => {
  try {
    const cashOutRequests = await CashOutModel.find()
      .populate({
        path: "accountId", // WalletConnection se related data lana hai
        select: "walletNumber walletType", // Sirf ye fields chahiye
      })
      .populate({
        path: "userId", // Agar user ka bhi data lana ho to yahan mention kar sakte ho
        select: "name email", // Example fields
      });

    return res.status(200).json(cashOutRequests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server error. Please try again later.",
    });
  }
};

// Admin controller to update the status of a cash-out request
const updateCashOutStatus = async (req, res) => {
  try {
    const { id, status } = req.body; // 'id' is the CashOut record ID and 'status' is the new status
    if (!["calculating", "completed", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const cashOut = await CashOutModel.findById(id);
    if (!cashOut) {
      return res.status(404).json({ message: "Cash-out request not found." });
    }

    cashOut.status = status;
    await cashOut.save();

    return res
      .status(200)
      .json({ message: "Cash-out status updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server error. Please try again later.",
    });
  }
};

// Admin controller to delete a cash-out request
const deleteCashOutRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const cashOut = await CashOutModel.findById(id);
    if (!cashOut) {
      return res.status(404).json({ message: "Cash-out request not found." });
    }

    await cashOut.remove();
    return res
      .status(200)
      .json({ message: "Cash-out request deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server error. Please try again later.",
    });
  }
};

module.exports = {
  requireSign,
  IsAdmin,
  requestCashOut,
  getAllCashOutRequests,
  updateCashOutStatus,
  deleteCashOutRequest,
};
