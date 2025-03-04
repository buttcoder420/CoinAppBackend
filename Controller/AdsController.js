const moment = require("moment");
const { expressjwt: jwt } = require("express-jwt");
const AdsModel = require("../Models/AdsModel");
const UserRegisterModel = require("../Models/UserRegisterModel");
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
const watchAd = async (req, res) => {
  try {
    const userId = req.auth?._id; // Assuming user is authenticated

    // Check if user already watched ad today
    const today = moment().startOf("day");
    const existingAd = await AdsModel.findOne({
      userId,
      createdAt: { $gte: today.toDate() },
    });

    if (existingAd) {
      return res.status(400).json({
        success: false,
        message: "You have already watched today's ad.",
      });
    }

    // Define rewards
    const adsCoin = 100;
    const adsAmount = 0.09;

    // Store Ad Watch Data
    const newAd = new AdsModel({
      userId,
      adsCoin,
      adsAmount,
    });
    await newAd.save();

    // Update User Coins and Amount
    const user = await UserRegisterModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.coin += adsCoin;
    user.amount += adsAmount;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Ad watched successfully!",
      coinsEarned: adsCoin,
      amountEarned: adsAmount,
      totalCoins: user.coin,
      totalAmount: user.amount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getUserAdStats = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for searching user ad stats.",
      });
    }

    // Find user by email
    const user = await UserRegisterModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get ad watch data for the user
    const adsData = await AdsModel.find({ userId: user._id }).sort({
      createdAt: -1,
    });

    if (adsData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "User has not watched any ads yet.",
        data: {
          totalAdsClaimed: 0,
          totalEarnings: 0,
          adsHistory: [],
        },
      });
    }

    // Calculate total ads claimed and total earnings
    const totalAdsClaimed = adsData.length;
    const totalEarnings = adsData.reduce((acc, ad) => acc + ad.adsAmount, 0);

    return res.status(200).json({
      success: true,
      message: "User ad statistics retrieved successfully.",
      data: {
        totalAdsClaimed,
        totalEarnings,
        adsHistory: adsData.map((ad) => ({
          claimedAt: ad.createdAt,
          earnedCoins: ad.adsCoin,
          earnedAmount: ad.adsAmount,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching user ad stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user ad stats.",
    });
  }
};

module.exports = { requireSign, IsAdmin, watchAd, getUserAdStats };
