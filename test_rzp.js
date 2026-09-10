require('dotenv').config({path: '.env.local'});
const Razorpay = require('razorpay');
const raz = new Razorpay({ key_id: 'test', key_secret: 'test' });
console.log(raz.paymentLink.create);
