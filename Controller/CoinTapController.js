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
  const { x, y } = req.body;

  try {
    let coinTabRecord = await TapCoinModel.findOne({ userId });

    if (!coinTabRecord) {
      coinTabRecord = new TapCoinModel({
        userId,
        coins: 0,
        taps: [],
        remainingLimit: 10,
      });
    }

    if (coinTabRecord.remainingLimit <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "You have reached your daily limit. Please try again tomorrow.",
      });
    }

    if (coinTabRecord.coins < 1000) {
      coinTabRecord.coins += 1;
      coinTabRecord.taps.push({ x, y });
      coinTabRecord.remainingLimit -= 1;
    } else {
      coinTabRecord = new TapCoinModel({
        userId,
        coins: 1,
        taps: [{ x, y }],
        remainingLimit: 999,
      });
    }

    await coinTabRecord.save();

    const user = await UserRegisterModel.findById(userId);
    if (user) {
      user.coin += 1;
      await user.save();
    }

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

const getRemainingLimit = async (req, res) => {
  const userId = req.auth?._id;

  try {
    const coinTabRecord = await TapCoinModel.findOne({ userId });

    if (!coinTabRecord) {
      return res.status(404).json({
        success: false,
        message: "User record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        remainingLimit: coinTabRecord.remainingLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching remaining limit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch remaining limit.",
    });
  }
};

const resetDailyLimit = async (req, res) => {
  const userId = req.auth?._id;

  try {
    const coinTabRecord = await TapCoinModel.findOne({ userId });

    if (!coinTabRecord) {
      return res.status(404).json({
        success: false,
        message: "User record not found.",
      });
    }

    coinTabRecord.remainingLimit = 10;
    await coinTabRecord.save();

    res.status(200).json({
      success: true,
      message: "Daily limit reset successfully!",
      data: {
        remainingLimit: coinTabRecord.remainingLimit,
      },
    });
  } catch (error) {
    console.error("Error resetting daily limit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset daily limit.",
    });
  }
};

module.exports = {
  requireSign,
  addCoinTap,
  getRemainingLimit,
  resetDailyLimit,
};
