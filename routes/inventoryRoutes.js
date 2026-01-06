const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/reserve', authMiddleware, inventoryController.reserveInventory);


router.get('/:sku', inventoryController.getInventoryBySku);

module.exports = router;
