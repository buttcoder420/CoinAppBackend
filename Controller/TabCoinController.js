var { expressjwt: jwt } = require("express-jwt");
const TapCoinModel = require("../Models/TapCoinModel");
const UserRegisterModel = require("../Models/UserRegisterModel");

// Middleware for requiring a signed-in user
const requireSign = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  requestProperty: "auth", // Adds the user data to req.auth
});

// Controller to add a coin for the logged-in user
const addCoin = async (req, res) => {
  try {
    const userId = req.auth?._id; // Get user ID from token
    const { x, y } = req.body; // Tap position coordinates

    // Validate tap coordinates
    if (x === undefined || y === undefined) {
      return res
        .status(400)
        .json({ message: "Tap coordinates (x, y) are required" });
    }

    const today = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD format)

    // Find today's coin data for the user
    let userCoinData = await TapCoinModel.findOne({ userId, date: today });

    // If no record for today, create a new entry
    if (!userCoinData) {
      userCoinData = new TapCoinModel({
        userId,
        coins: 0,
        taps: [],
        date: today,
      });
    }

    // Check if daily limit is reached
    if (userCoinData.taps.length >= 10) {
      return res
        .status(400)
        .json({ message: "Daily tap limit reached (1000)." });
    }

    // Increment coins and save tap
    userCoinData.coins += 1;
    userCoinData.taps.push({ x, y });

    await userCoinData.save();

    // Update user model coin balance
    await UserRegisterModel.findByIdAndUpdate(userId, { $inc: { coin: 1 } });

    res.status(200).json({
      message: "Coin added successfully",
      dailyCoins: userCoinData.coins,
      totalTaps: userCoinData.taps.length,
    });
  } catch (error) {
    console.error("Error adding coin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  requireSign,
  addCoin,
};
