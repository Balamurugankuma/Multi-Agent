const Razorpay = require('razorpay');
const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret ||
      keyId.includes('your_key') ||
      keyId === 'rzp_test_your_key_id_here') return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};
module.exports = getRazorpay;
