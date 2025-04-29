const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
const router = require('./routes/route.js');

const PORT = process.env.PORT || 5000;

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ NOT CONNECTED TO DATABASE", err));

// Routes
app.use('/', router);





// Server listening
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
