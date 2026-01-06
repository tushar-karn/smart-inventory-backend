const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post(
    '/confirm',
    authMiddleware,
    checkoutController.confirmCheckout
);

router.post(
    '/cancel',
    authMiddleware,
    checkoutController.cancelCheckout
);

module.exports = router;
