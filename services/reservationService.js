const Inventory = require('../models/Inventory');
const Reservation = require('../models/Reservation');

const TTL = (Number(process.env.RESERVATION_TTL_MINUTES) || 5) * 60 * 1000;

exports.reserveInventory = async ({
    reservationId,
    userId,
    sku,
    quantity
}) => {
    // Idempotency check
    const existing = await Reservation.findOne({ reservationId });
    if (existing) return existing;

    // Atomic stock reservation
    const inventory = await Inventory.findOneAndUpdate(
        {
            sku,
            $expr: {
                $gte: [
                    { $subtract: ['$totalStock', { $add: ['$reservedStock', '$soldStock'] }] },
                    quantity
                ]
            }
        },
        { $inc: { reservedStock: quantity } },
        { new: true }
    );

    if (!inventory) {
        throw new Error('INSUFFICIENT_STOCK');
    }

    return Reservation.create({
        reservationId,
        userId,
        sku,
        quantity,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + TTL)
    });
};

exports.confirmReservation = async (reservationId, userId) => {
    const reservation = await Reservation.findOne({ reservationId, userId });
    if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

    if (reservation.status === 'CONFIRMED') return reservation;
    if (reservation.status !== 'ACTIVE') throw new Error('RESERVATION_INVALID');
    if (reservation.expiresAt < new Date()) throw new Error('RESERVATION_EXPIRED');

    await Inventory.updateOne(
        { sku: reservation.sku },
        {
            $inc: {
                reservedStock: -reservation.quantity,
                soldStock: reservation.quantity
            }
        }
    );

    reservation.status = 'CONFIRMED';
    await reservation.save();
    return reservation;
};

exports.cancelReservation = async (reservationId, userId) => {
    const reservation = await Reservation.findOne({ reservationId, userId });
    if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

    if (reservation.status === 'CANCELLED') return reservation;
    if (reservation.status !== 'ACTIVE') throw new Error('RESERVATION_INVALID');

    await Inventory.updateOne(
        { sku: reservation.sku },
        { $inc: { reservedStock: -reservation.quantity } }
    );

    reservation.status = 'CANCELLED';
    await reservation.save();
    return reservation;
};
