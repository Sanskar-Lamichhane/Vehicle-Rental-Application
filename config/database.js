const mongoose=require("mongoose");

mongoose.connect('mongodb://127.0.0.1:27017/VehicleRentalApplication')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err.message))