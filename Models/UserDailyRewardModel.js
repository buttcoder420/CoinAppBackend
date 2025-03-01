const mongoose = require("mongoose");

const dailyRewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "reward",
    required: true,
  },
  coins: { type: Number, required: true },
  amount: { type: Number, required: true },
  isClaimed: { type: Boolean, default: false },
  claimedAt: { type: Date, default: Date.now },
  isDouble: { type: String, enum: ["Yes", "No"], default: "No" },
});

module.exports = mongoose.model("Dailyreward", dailyRewardSchema);
