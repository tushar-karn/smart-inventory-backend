const Inventory = require('../models/Inventory');
const reservationService = require('../services/reservationService');

exports.reserveInventory = async (req, res) => {
  try {
    const { reservationId, sku, quantity } = req.body;
    const userId = req.user.userId;

    if (!reservationId || !sku || !quantity) {
      return res.status(400).json({
        message: 'reservationId, sku and quantity are required'
      });
    }

    const reservation = await reservationService.reserveInventory({
      reservationId,
      userId,
      sku,
      quantity
    });

    res.status(201).json({
      status: 'RESERVED',
      reservationId: reservation.reservationId,
      expiresAt: reservation.expiresAt
    });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({
        message: 'Insufficient inventory'
      });
    }

    res.status(500).json({
      message: 'Failed to reserve inventory'
    });
  }
};

/**
 * GET /inventory/:sku
 * Get inventory status
 */
exports.getInventoryBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      return res.status(404).json({
        message: 'SKU not found'
      });
    }

    res.json({
      sku: inventory.sku,
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      soldStock: inventory.soldStock,
      availableStock:
        inventory.totalStock -
        inventory.reservedStock -
        inventory.soldStock
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch inventory'
    });
  }
};
