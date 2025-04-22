const mongoose = require('mongoose');
const User = require("./User")
const Brand = require("./brand")
const Type = require("./vehicleType");


// Define the schema for a vehicle
const vehicleSchema = new mongoose.Schema({
  make: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Brand"
  },
  model: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
    enum: ["chitwan", "kathmandu", "butwal", "lalitpur", "hetauda", "bhaktapur", "birgunj", "biratnagar", "dhangadi", "surkhet"],
    set: function(req_value){
      if(req_value){
      return req_value.toLowerCase();
      }
    }
  },
  year: {
    type: Number,
    required: true,
    min:1900,
    max:2025
  },
  registration_number: {
    type: String,
    required: true,
    // validate: {
    //   validator: async function (req_value) {
    //     let count = await mongoose.models.Vehicle.countDocuments({ registration_number: req_value });
    //     if (count) {
    //       return false
    //     }
    //     return true
    //   },
    //   message: "Registration Number is already in use"
    // }

  },
  vehicle_type: {
    type: mongoose.Schema.Types.ObjectId,
    required:true,
    ref: "Type"
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
  currency_type: {
    type: String,
    default: "NPR"
  },
  color: {
    type: String,
    required: true,
    enum: ["Black", "Red", "Blue", "Violet", "Grey", "White", "Yellow", "Pink"]
  },
  capacity: {
    type: Number,
    required: true,
    minlength: 2,
    maxlength: 15
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
  service: {
    type: String,
    enum: ["on", "off"],
    required: true
  },
  reviews: [
    {
      rating: {
        type: Number,
        minlength: 1,
        maxlength: 5,
        required: true,
      },
      created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      comment: {
        type: String
      }
    }
  ],
  driver: {
    name: {
      type: String,
      min: 3,
      max: 40
    },
    noOfExperience: {
      type: Number,
      min: 1,
      max: 50
    },
    phoneNumber: {
      type: String,
      unique: true,
      match: /^\+9779[0-9]{9}$/,
      // validate: {
      //   validator: async function (req_value) {
      //     let count = await mongoose.models.Vehicle.countDocuments({ "driver.phoneNumber": req_value });
      //     if (count) {
      //       return false
      //     }
      //     return true
      //   },
      //   message: "Driver phone number already in use"
      // }

    }
  },
  created_by: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
},
  {
    timestamps: true
  });

// Create and export the Vehicle model
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
