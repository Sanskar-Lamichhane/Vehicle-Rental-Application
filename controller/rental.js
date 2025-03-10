const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");

const createRental = async (req, res, next) => {
  try {
    const { price, per_day, pickUpDateTime, dropOffDateTime } = req.body;
    const customer = req.user._id; // Authenticated user's ID (customer)

    // Find the vehicle details
    const vehicleDetails = await Vehicle.findById(req.params.id);
    if (!vehicleDetails) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Check if the customer already has a pending request for the same vehicle
    const existingPendingRental = await Rental.findOne({
      vehicle: vehicleDetails._id,
      customer: customer, // Ensure the check is for the same customer
      status: "Pending", // Only check for pending requests
      $or: [
        // Check if the new rental period overlaps with existing rentals
        { 
          pickUpDateTime: { $lt: new Date(dropOffDateTime) },
          dropOffDateTime: { $gt: new Date(pickUpDateTime) }
        },
        { 
          pickUpDateTime: { $lt: new Date(dropOffDateTime) },
          dropOffDateTime: { $gt: new Date(pickUpDateTime) }
        }
      ]
    });

    if (existingPendingRental) {
      return res.status(400).json({ message: "You already have a pending request for this vehicle." });
    }

    // Check if the vehicle is already rented in the selected time range
    const overlappingRental = await Rental.findOne({
      vehicle: vehicleDetails._id,
      status: { $nin: ["Completed", "Rejected"] }, // Check only if the rental is active or pending
      $and: [
        { pickUpDateTime: { $lt: new Date(dropOffDateTime) } },
        { dropOffDateTime: { $gt: new Date(pickUpDateTime) } }
      ]
    });

    if (overlappingRental) {
      return res.status(400).json({ message: "Vehicle is not available during the selected time frame." });
    }

    // Create new rental request
    const newRental = new Rental({
      vehicle: vehicleDetails._id,
      customer: customer,
      price,
      per_day,
      vendor: vehicleDetails.created_by,
      pickUpDateTime: new Date(pickUpDateTime),
      dropOffDateTime: new Date(dropOffDateTime),
      status: "Pending"
    });

    const savedRental = await newRental.save();
    res.status(201).json({
      message: "Rental created successfully.",
      rental: savedRental
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRental };
