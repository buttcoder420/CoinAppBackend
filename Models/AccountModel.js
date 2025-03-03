const mongoose = require("mongoose");

const walletConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletType: {
    type: String,
    enum: ["EasyPaisa", "JazzCash"],
    required: true,
  },
  walletNumber: {
    type: String,
    required: true,
  },
  connectionStatus: {
    type: String,
    enum: ["connected", "disconnected"],
    default: "connected",
  },
  connectionDate: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

walletConnectionSchema.pre("save", function (next) {
  this.updatedAt = Date.now(); // Har save ke baad updated date change karna
  next();
});

module.exports = mongoose.model("WalletConnection", walletConnectionSchema);
