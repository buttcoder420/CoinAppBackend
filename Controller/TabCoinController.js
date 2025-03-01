const { expressjwt: jwt } = require("express-jwt");
const TapCoinModel = require("../Models/TapCoinModel");
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
const addCoinTap = async (req, res) => {
  const userId = req.auth?._id;
  const { x, y } = req.body; // User ID aur tap coordinates

  try {
    // Step 1: Check if the user exists in the CoinTab schema
    let coinTabRecord = await TapCoinModel.findOne({ userId });

    if (!coinTabRecord) {
      // Agar record nahi hai, toh naya record create karein
      coinTabRecord = new TapCoinModel({
        userId,
        coins: 0,
        taps: [],
        remainingLimit: 10,
      });
    }

    // Step 2: Check if the user has reached the daily limit
    if (coinTabRecord.remainingLimit <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "You have reached your daily limit. Please try again tomorrow.",
      });
    }

    // Step 3: Check if the user's coins are less than 1000
    if (coinTabRecord.coins < 1000) {
      // Agar coins 1000 se kam hai, toh existing record mein update karein
      coinTabRecord.coins += 1; // 1 coin add karein
      coinTabRecord.taps.push({ x, y }); // Tap coordinates add karein
      coinTabRecord.remainingLimit -= 1; // Daily limit decrement karein
    } else {
      // Agar coins 1000 se zyada hai, toh naya record create karein
      coinTabRecord = new TapCoinModel({
        userId,
        coins: 1, // Naya record, 1 coin se start karein
        taps: [{ x, y }], // Tap coordinates add karein
        remainingLimit: 9, // Kyunki 1 tap use ho gaya hai
      });
    }

    // Step 4: Save the updated CoinTab record
    await coinTabRecord.save();

    // Step 5: Update the user's total coins in the User schema
    const user = await UserRegisterModel.findById(userId);
    if (user) {
      user.coin += 1; // User ke total coins mein 1 add karein
      await user.save();
    }

    // Step 6: Send success response
    res.status(200).json({
      success: true,
      message: "Coin added successfully!",
      data: {
        coins: coinTabRecord.coins,
        remainingLimit: coinTabRecord.remainingLimit,
      },
    });
  } catch (error) {
    console.error("Error adding coin tap:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add coin tap",
    });
  }
};

module.exports = { requireSign, addCoinTap };
