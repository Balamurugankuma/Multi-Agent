const express = require('express');
const router  = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify',       verifyRazorpayPayment);
router.get('/history',                getPaymentHistory);
module.exports = router;
