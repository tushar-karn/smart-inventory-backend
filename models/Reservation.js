const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        reservationId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        sku: {
            type: String,
            required: true,
            index: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ['ACTIVE', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
            default: 'ACTIVE',
            index: true
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
