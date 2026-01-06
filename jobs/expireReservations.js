const Reservation = require('../models/Reservation');
const Inventory = require('../models/Inventory');

const expireReservations = async () => {
    try {
        const now = new Date();

        const expiredReservations = await Reservation.find({
            status: 'ACTIVE',
            expiresAt: { $lt: now }
        });

        for (const reservation of expiredReservations) {
            await Inventory.updateOne(
                { sku: reservation.sku },
                { $inc: { reservedStock: -reservation.quantity } }
            );

            reservation.status = 'EXPIRED';
            await reservation.save();
        }

        if (expiredReservations.length > 0) {
            console.log(`⏰ Expired ${expiredReservations.length} reservations`);
        }
    } catch (error) {
        console.error('Error expiring reservations:', error.message);
    }
};

module.exports = expireReservations;
