const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  price:{
    type: Number,
    required:true
  },
  per_day:{
    type:Number,
    required:true
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pickUpDateTime: { 
    type: Date,  // This will store both date and time
    required: true 
  },
  dropOffDateTime: { 
    type: Date,  // This will store only the date, no time needed
    required: true 
  },
  actualDropOffDateTime: { 
    type: Date,  // This will store actual drop-off date and time
    default: null 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'In Trip', 'Completed', 'Cancelled', 'Rejected'], 
    default: 'Pending' 
  }
},
{
    timestamps:true
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
