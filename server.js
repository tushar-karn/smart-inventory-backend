const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();

const PORT = process.env.PORT || 4000;

const connectDB = require("./config/db");
connectDB();

app.get('/', (req, res) => {
  res.send('Smart Inventory Backend is running');
});


app.listen(PORT, () => {
  console.log(`🚀 Smart Inventory Backend running on port ${PORT}`);
});
