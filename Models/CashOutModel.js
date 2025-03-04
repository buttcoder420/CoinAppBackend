const mongoose = require("mongoose");

const CashOutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletConnection",
      required: true,
    },
    coinAmount: { type: Number, required: true, min: 1 }, // Amount of coins the user wants to cash out
    status: {
      type: String,
      enum: ["calculating", "completed", "failed"],
      default: "calculating",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashOut", CashOutSchema);
