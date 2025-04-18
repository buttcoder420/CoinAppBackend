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
    const { accountId, coinAmount } = req.body;
    const userId = req.auth?._id; // Assuming user is logged in and middleware is setting req.user

    // Validate input
    if (!accountId || !coinAmount) {
      return res
        .status(400)
        .json({ message: "Account and coin amount are required." });
    }

    // Minimum coins validation
    if (coinAmount < 20000) {
      return res
        .status(400)
        .json({ message: "Minimum cash-out amount is 20000 coins." });
    }

    // Get user data
    const user = await UserRegisterModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user has enough coins
    if (user.coin < coinAmount) {
      return res.status(400).json({ message: "Insufficient coins." });
    }

    // Deduct coins from user account
    user.coin -= coinAmount;
    await user.save();

    // Create cash-out request
    const cashOutRequest = new CashOutModel({
      userId,
      accountId,
      coinAmount,
      status: "calculating",
    });

    await cashOutRequest.save();

    return res.status(201).json({
      message: "Cash-out request submitted successfully.",
      cashOutRequest: cashOutRequest,
    });
  } catch (error) {
    console.error("Cash-out error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// Admin controller to manage all cash-out requests
const getAllCashOutRequests = async (req, res) => {
  try {
    const cashOuts = await CashOutModel.find()
      .populate("userId", "name email")
      .populate("accountId", "walletType walletNumber");

    if (!cashOuts) {
      return res.status(404).json({ message: "No cashout requests found" });
    }

    res.status(200).json(cashOuts);
  } catch (err) {
    console.error("Cashout Fetch Error:", err.message); // Error log karo
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

const getUserCashOutRequests = async (req, res) => {
  try {
    const userId = req.auth?._id; // ✅ Logged-in user ID

    // Check if user exists
    const user = await UserRegisterModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Fetch all cash-out requests for the logged-in user
    const cashOutRequests = await CashOutModel.find({ userId })
      .populate({
        path: "accountId",
        select: "walletNumber walletType", // ✅ Wallet details
      })
      .sort({ createdAt: -1 }); // ✅ Latest requests first

    return res.status(200).json({
      success: true,
      TotalCashOut: cashOutRequests.length,
      cashOutRequests,
    });
  } catch (error) {
    console.error("Error fetching user cash-out requests:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// Admin controller to update the status of a cash-out request
const updateCashOutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'id' is the CashOut record ID and 'status' is the new status
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

// Controller to get the total number of "calculating" status cash-outs
const getCalculatingCashOutsCount = async (req, res) => {
  try {
    // Find all cash-out requests with "calculating" status
    const calculatingCashOuts = await CashOutModel.countDocuments({
      status: "calculating",
    });

    if (calculatingCashOuts === null) {
      return res.status(404).json({
        message: "No cash-out requests found with calculating status.",
      });
    }

    // Return the total count of cash-out requests with "calculating" status
    return res.status(200).json({
      success: true,
      totalCalculatingCashOuts: calculatingCashOuts,
    });
  } catch (error) {
    console.error("Error fetching calculating cash-out requests:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = {
  requireSign,
  IsAdmin,
  getCalculatingCashOutsCount,
  requestCashOut,
  getAllCashOutRequests,
  updateCashOutStatus,
  deleteCashOutRequest,
  getUserCashOutRequests,
};
