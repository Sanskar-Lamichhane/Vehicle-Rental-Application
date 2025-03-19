const Vehicle = require("../model/Vehicle");
const User = require("../model/User"); // Assuming you have a User model
const mongoose = require("mongoose");
const Rental= require("../model/Rental")

const VendorList = async (req, res, next) => {
    try {
      // Query for vendors, excluding the 'password' field
      const vendors = await User.find({ role: "vendor" }).select('-password');
      
      res.status(200).send({
        vendors: vendors
      });
    } catch (err) {
      next(err);
    }
  };


  const CustomerList = async(req,res,next)=>{
    try{
        const customers = await User.find({role:"customer"}).select('-password')
        res.status(200).send(
            {
                customers:customers
            }
        )

    }
    catch(err){
        next(err);
    }
  }

  const getVehiclesNotRentedYet = async (req, res, next) => {
      try {
        // Step 1: Find all vehicle IDs that are associated with any rental in the Rental collection
        const rentedVehicleIds = await Rental.find().distinct("vehicle");
    
        // Step 2: Find all vehicles whose IDs are not in the rentedVehicleIds list
        const vehiclesNotRented = await Vehicle.find({
          _id: { $nin: rentedVehicleIds }
        });
    
        // Step 3: Send the response
        res.status(200).json({
          vehicles: vehiclesNotRented
        });
      } catch (err) {
        next(err);
      }
    };


    const deleteUnrentedVehicle = async (req, res, next) => {
        try {
            const vehicleId = req.params.id;

            // Check if params.id is a valid ObjectId (24 hexadecimal characters)
                if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
                  return res.status(400).send({
                    message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
                  });
                }
    
            // Step 1: Check if the vehicle is in any rental
            const rental = await Rental.findOne({ vehicle: vehicleId });
    
            if (rental) {
                return res.status(400).json({
                    message: "Vehicle is currently rented and cannot be deleted."
                });
            }
    
            // Step 2: If not rented, proceed to delete the vehicle
            const vehicle = await Vehicle.findByIdAndDelete(vehicleId);
    
            if (!vehicle) {
                return res.status(404).json({
                    message: "Vehicle not found."
                });
            }
    
            // Step 3: Send response confirming the deletion
            res.status(200).json({
                message: "Vehicle deleted successfully.",
                DeletedVehicle:vehicle
            });
    
        } catch (err) {
            next(err);  // Pass errors to the error handler
        }
    };


    const toggleUserStatus = async (req, res, next) => {
      try {
        const { id } = req.params;

        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).send({
            message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
          });
        }
        
        // Fetch the customer by ID
        const user = await User.findById(id);
        
        if (!user) {
          return res.status(404).send({ message: 'User not found' });
        }
    
        // Toggle isActive status
        const updatedStatus = user.isActive ? false : true;  // If true, set false (lock), if false, set true (unlock)
    
        // Update the customer's status (isActive field)
        user.isActive = updatedStatus;
    
        await user.save({validateModifiedOnly: true});
    
        // Send response back
        res.status(200).send({
          message: `User has been ${updatedStatus ? 'unlocked' : 'locked'}`,
          user: {
            id: user._id,
            isActive: user.isActive
          }
        });
    
      } catch (err) {
        next(err);
      }
    };
    
  
  

module.exports = { VendorList, CustomerList, getVehiclesNotRentedYet, deleteUnrentedVehicle, toggleUserStatus};
