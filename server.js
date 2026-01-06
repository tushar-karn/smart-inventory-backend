const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

const connectDB = require('./config/db');
const expireReservations = require('./jobs/expireReservations');

connectDB();

setInterval(expireReservations, 60 * 1000);

app.get('/', (req, res) => {
    res.send('Smart Inventory Backend is running');
});

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

app.use('/auth', authRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/checkout', checkoutRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Smart Inventory Backend running on port ${PORT}`);
});
