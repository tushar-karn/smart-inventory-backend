const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        totalStock: {
            type: Number,
            required: true,
            min: 0
        },

        reservedStock: {
            type: Number,
            default: 0,
            min: 0
        },

        soldStock: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);


inventorySchema.virtual('availableStock').get(function () {
    return this.totalStock - this.reservedStock - this.soldStock;
});

module.exports = mongoose.model('Inventory', inventorySchema);
