const { expressjwt: jwt } = require("express-jwt");
const AccountModel = require("../Models/AccountModel");

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

// Controller to connect wallet and disconnect any previous connection of the same wallet type
const connectWallet = async (req, res) => {
  try {
    const { walletType, walletNumber } = req.body;
    const userId = req.auth?._id; // Assuming user is logged in and user ID is available in the req.user object

    // Step 1: Disconnect any previously connected wallet of the same type
    const existingWallets = await AccountModel.find({
      userId,
      walletType,
      connectionStatus: "connected",
    });
    if (existingWallets.length > 0) {
      await AccountModel.updateMany(
        { userId, walletType, connectionStatus: "connected" },
        { $set: { connectionStatus: "disconnected" } }
      );
    }

    // Step 2: Create new wallet connection record
    const newWallet = new AccountModel({
      userId,
      walletType,
      walletNumber,
      connectionStatus: "connected",
    });

    // Save the wallet connection to the database
    await newWallet.save();

    // Return success response
    res.status(201).json({
      message: `${walletType} wallet connected successfully`,
      data: newWallet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to disconnect wallet
const disconnectWallet = async (req, res) => {
  try {
    const { walletType } = req.body;
    const userId = req.auth?._id; // Assuming user is logged in and user ID is available in the req.user object

    // Find the wallet connection record
    const wallet = await AccountModel.findOne({ userId, walletType });

    if (!wallet) {
      return res
        .status(400)
        .json({ message: `${walletType} wallet is not connected` });
    }

    // Update wallet connection status to 'disconnected'
    wallet.connectionStatus = "disconnected";
    await wallet.save();

    // Return success response
    res.status(200).json({
      message: `${walletType} wallet disconnected successfully`,
      data: wallet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get all accounts for a logged-in user
const getAllAccounts = async (req, res) => {
  try {
    const userId = req.auth?._id; // Assuming user is logged in and user ID is available in the req.user object

    // Fetch all accounts associated with the user
    const accounts = await AccountModel.find({ userId });

    // Return the list of all accounts
    res.status(200).json({
      message: "All accounts retrieved successfully",
      TotalAccount: accounts.length,
      data: accounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get only connected accounts for a logged-in user
const getConnectedAccounts = async (req, res) => {
  try {
    const userId = req.auth?._id; // Assuming user is logged in and user ID is available in the req.user object

    // Fetch only connected accounts associated with the user
    const connectedAccounts = await AccountModel.find({
      userId,
      connectionStatus: "connected",
    });

    // Return the list of connected accounts
    res.status(200).json({
      message: "Connected accounts retrieved successfully",
      data: connectedAccounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const setAccountConnectionStatus = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.auth?._id; // Ensure user authentication

    // Disconnect all other accounts of the user
    await AccountModel.updateMany(
      { userId },
      { connectionStatus: "disconnected" }
    );

    // Connect the selected account
    const updatedAccount = await AccountModel.findByIdAndUpdate(
      accountId,
      { connectionStatus: "connected" },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Account connected successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating account connection status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  requireSign,
  connectWallet,
  disconnectWallet,
  getAllAccounts,
  getConnectedAccounts,
  setAccountConnectionStatus,
};
