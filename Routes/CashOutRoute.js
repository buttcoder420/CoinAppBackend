const express = require("express");
const {
  requestCashOut,
  requireSign,
  getAllCashOutRequests,
  updateCashOutStatus,
  IsAdmin,
  deleteCashOutRequest,
  getUserCashOutRequests,
  getCalculatingCashOutsCount,
} = require("../Controller/CashOutController");
const router = express.Router();

// Route for user to request cash-out
router.post("/cash-out", requireSign, requestCashOut);

// Routes for admin to manage cash-out requests
router.get("/cash-out", requireSign, getAllCashOutRequests);
router.get("/get-single-cashOut", requireSign, getUserCashOutRequests);

router.put(
  "/cash-out/update-status/:id",
  requireSign,

  updateCashOutStatus
);
router.delete("/admin/cash-out/:id", requireSign, deleteCashOutRequest);

router.get("/get-cash-no", requireSign, getCalculatingCashOutsCount);

module.exports = router;
