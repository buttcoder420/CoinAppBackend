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
    const adsAmount = 0.009;

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

module.exports = { requireSign, watchAd };
