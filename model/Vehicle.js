const mongoose = require('mongoose');
const User=require("./User")


// Define the schema for a vehicle
const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true,
    enum:["suzuki", "byd", "honda", "ford", "hyundai", "mahindra"]
  },
  model: {
    type: String,
    required: true
  },
  location:{
    type:String,
    required:true,
    enum:["chitwan", "kathmandu", "butwal", "lalitpur"]
  },
  year: {
    type: Number,
    required: true
  },
  registration_number: {
    type: String,
    required: true,
    unique: true
  },
  vehicle_type: {
    type: String,
    enum: ["sedan", "suv", "jeep", "luxury vehicle", "vans", "hatchback", "convertible"],
    required: true,
    set:function(req_value){
        return req_value.toLowerCase();
    }
  },
  kilometers_per_day: {
    type: Number,
    required: true
  },
  per_extra_kilometer: {
    type: Number,
    required: true
  },
  price_per_day: {
    type: Number,
    required: true
  },
  currency_type:{
    type:String,
    default:"NPR"
  },
  color: {
    type: String,
    required:true,
    enum:["Black","Red","Sky Blue","Violet", "Grey", "White", "Yellow", "Pink", "Dark Blue", "Light Blue"]
  },
  capacity: {
    type: Number,
    required: true,
    min:2,
    max:15
  },
  fuel_type: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic'],
    required: true
  },
  images: [
    {
      type: String // Array to store image URLs or paths
    }
  ],
  description: {
    type: String
  },
  created_by:{
    required:true,
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  }
},
{
    timestamps:true
});

// Create and export the Vehicle model
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
