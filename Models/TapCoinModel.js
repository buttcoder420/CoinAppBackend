const mongoose = require("mongoose");

const coinTabSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coins: {
    type: Number,
    default: 0,
  },
  taps: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      x: Number, // X coordinate of the tap
      y: Number, // Y coordinate of the tap
    },
  ],
  DailyLimit: { type: Number, default: 1000 },
  remainingLimit: { type: Number },
});

module.exports = mongoose.model("CoinTab", coinTabSchema);
