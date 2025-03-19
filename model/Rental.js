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
  pickUpLocation: {
    type: String,
    minlength: 3,
    maxlength: 90
  },
  dropOffLocation: {
    type: String,
    minlength: 3,
    maxlength: 90
  },
  pickUpDateTime: { 
    type: Date,  // This will store both date and time
    required: true 
  },
  dropOffDateTime: { 
    type: Date,  // This will store only the date, no time needed
    required: true 
  },
  approvedAt:{
    type:Date,
    required:false
  },
  actualDropOffDateTime: { 
    type: Date,  // This will store actual drop-off date and time
    required:false
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'In Trip', 'Completed', 'Cancelled', 'Rejected'], 
    default: 'Pending' 
  },
  rejection_message:{
    type:String,
    required:false
  },
  cancelled_at:{
    type:Date,
    required:false
  },
  approved_at:{
    type:Date,
    required:false
  },
  rejected_at:{
    type:Date,
    required:false
  },
  InTrip_at:{
    type:Date,
    requried:false
  },
  cancellation_message:{
    type:String,
    required:false
  },
  journey_details:{
    type:String,
    required:true,
    minlength: 10,
    maxlength:300
  }
},
{
    timestamps:true
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
