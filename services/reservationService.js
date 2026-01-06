const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Reservation = require('../models/Reservation');

const RESERVATION_TTL_MINUTES =
  Number(process.env.RESERVATION_TTL_MINUTES) || 5;

/**
 * Reserve inventory atomically
 * Idempotent by reservationId
 */
exports.reserveInventory = async ({
  reservationId,
  userId,
  sku,
  quantity
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Idempotency check
    const existingReservation = await Reservation.findOne(
      { reservationId },
      null,
      { session }
    );

    if (existingReservation) {
      return existingReservation;
    }

    // 2️⃣ Atomically reserve stock
    const inventory = await Inventory.findOneAndUpdate(
      {
        sku,
        $expr: {
          $gte: [
            {
              $subtract: [
                '$totalStock',
                { $add: ['$reservedStock', '$soldStock'] }
              ]
            },
            quantity
          ]
        }
      },
      {
        $inc: { reservedStock: quantity }
      },
      { new: true, session }
    );

    if (!inventory) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    // 3️⃣ Create reservation
    const expiresAt = new Date(
      Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000
    );

    const reservation = await Reservation.create(
      [
        {
          reservationId,
          userId,
          sku,
          quantity,
          expiresAt,
          status: 'ACTIVE'
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return reservation[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Confirm checkout
 * Converts reserved stock into sold stock
 */
exports.confirmReservation = async (reservationId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findOne(
      { reservationId, userId },
      null,
      { session }
    );

    if (!reservation) {
      throw new Error('RESERVATION_NOT_FOUND');
    }

    // Idempotent confirm
    if (reservation.status === 'CONFIRMED') {
      return reservation;
    }

    if (reservation.status !== 'ACTIVE') {
      throw new Error('RESERVATION_INVALID');
    }

    if (reservation.expiresAt < new Date()) {
      throw new Error('RESERVATION_EXPIRED');
    }

    // Update inventory
    await Inventory.updateOne(
      { sku: reservation.sku },
      {
        $inc: {
          reservedStock: -reservation.quantity,
          soldStock: reservation.quantity
        }
      },
      { session }
    );

    reservation.status = 'CONFIRMED';
    await reservation.save({ session });

    await session.commitTransaction();
    return reservation;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel reservation
 * Releases reserved stock
 */
exports.cancelReservation = async (reservationId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findOne(
      { reservationId, userId },
      null,
      { session }
    );

    if (!reservation) {
      throw new Error('RESERVATION_NOT_FOUND');
    }

    // Idempotent cancel
    if (reservation.status === 'CANCELLED') {
      return reservation;
    }

    if (reservation.status !== 'ACTIVE') {
      throw new Error('RESERVATION_INVALID');
    }

    await Inventory.updateOne(
      { sku: reservation.sku },
      {
        $inc: { reservedStock: -reservation.quantity }
      },
      { session }
    );

    reservation.status = 'CANCELLED';
    await reservation.save({ session });

    await session.commitTransaction();
    return reservation;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
