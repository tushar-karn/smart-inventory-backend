const reservationService = require('../services/reservationService');


exports.confirmCheckout = async (req, res) => {
    try {
        const { reservationId } = req.body;
        const userId = req.user.userId;

        if (!reservationId) {
            return res.status(400).json({
                message: 'reservationId is required'
            });
        }

        const reservation =
            await reservationService.confirmReservation(reservationId, userId);

        res.json({
            status: 'CONFIRMED',
            reservationId: reservation.reservationId
        });
    } catch (error) {
        if (error.message === 'RESERVATION_EXPIRED') {
            return res.status(410).json({ message: 'Reservation expired' });
        }

        res.status(400).json({
            message: error.message
        });
    }
};


exports.cancelCheckout = async (req, res) => {
    try {
        const { reservationId } = req.body;
        const userId = req.user.userId;

        if (!reservationId) {
            return res.status(400).json({
                message: 'reservationId is required'
            });
        }

        const reservation =
            await reservationService.cancelReservation(reservationId, userId);

        res.json({
            status: 'CANCELLED',
            reservationId: reservation.reservationId
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};
