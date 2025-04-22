const mongoose = require('mongoose');
const User = require("./User")
const Brand = require("./brand")


// Define the schema for a vehicle
const vehicleTypeSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        min: 2,
        max: 50,
        // validate: {
        //     validator: async function (req_value) {
        //         let count = await mongoose.models.Type.countDocuments({ categoryName: req_value });
        //         if (count) {
        //             return false;
        //         }
        //         return true;
        //     },
        //     message: "Category name is already used"
        // }
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
{
    timestamps:true
});

// Create and export the Vehicle model
const Type = mongoose.model('Type', vehicleTypeSchema);

module.exports = Type;
