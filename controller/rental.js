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

    // Check if the vehicle is already rented in the selected time range
    const overlappingRental = await Rental.findOne({
      vehicle: vehicleDetails._id,
      status: { $ne: "Completed" },
      $and: [
        { pickupDateTime: { $lt: new Date(dropOffDateTime) } },
        { dropOffDateTime: { $gt: new Date(pickUpDateTime) } }
      ]
    });

    if (overlappingRental) {
      return res.status(400).json({ message: "Vehicle is not available during the selected time frame." });
    }

    // Create new rental
    const newRental = new Rental({
      vehicle: vehicleDetails._id,
      user: customer,
      price,
      per_day,
      vendor: vehicleDetails.created_by,
      pickupDateTime: new Date(pickUpDateTime),
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
