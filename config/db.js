const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/smartInventoryDatabase";

const connectDB = async () => {
    try {
        if (!DB_URI) {
            console.error('Database URI is not defined in environment variables');
            process.exit(1);
        }
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectDB;