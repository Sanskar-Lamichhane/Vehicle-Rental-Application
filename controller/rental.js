const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");

const createRental = async (req, res, next) => {
  try {
    const { price, per_day, pickUpDateTime, dropOffDateTime, journey_details } = req.body;
    const customer = req.user._id; // Authenticated user's ID (customer)

    // Convert to Date objects
    const pickUpDate = new Date(pickUpDateTime);
    const dropOffDate = new Date(dropOffDateTime);
    const now = new Date();

    // Validation: Pickup should be at least 2 hours ahead of now
    if (pickUpDate < new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
      return res.status(400).json({ message: "Pickup time must be at least 2 hours from now." });
    }

    // Validation: Drop-off should be after pickup
    if (dropOffDate <= pickUpDate) {
      return res.status(400).json({ message: "Drop-off time must be after the pickup time." });
    }

    // Find the vehicle details
    const vehicleDetails = await Vehicle.findById(req.params.id);
    if (!vehicleDetails) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Check if the customer already has a rental for any vehicle in the same date range
    const existingCustomerRental = await Rental.findOne({
      customer: customer, // Checking rentals for the same customer
      status: { $nin: ["Completed", "Rejected", "Cancelled"] }, // Ignore completed/cancelled/rejected rentals
      $and: [
        { pickUpDateTime: { $lt: dropOffDate } },
        { dropOffDateTime: { $gt: pickUpDate } }
      ]
    });

    if (existingCustomerRental) {
      return res.status(400).json({ message: "You already have a rental during this time frame." });
    }


    // Check if the vehicle is already rented in the selected time range
    const overlappingRental = await Rental.findOne({
      vehicle: vehicleDetails._id,
      status: { $nin: ["Completed", "Rejected", "Cancelled"] }, // Check only if the rental is active or pending
      $and: [
        { pickUpDateTime: { $lt: dropOffDate } },
        { dropOffDateTime: { $gt: pickUpDate } }
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
      pickUpDateTime: pickUpDate,
      dropOffDateTime: dropOffDate,
      status: "Pending",
      journey_details
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


// ✅ Change Rental Status API
const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // Rental ID from URL
    const { status, rejection_message } = req.body; // New status and optional rejection message

    // Allowed statuses
    const validStatuses = ["Approved", "In Trip", "Completed", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update request." });
    }

    // Find rental by ID
    const rental = await Rental.findById(id);

    // Prevent changes after "Completed"
    if (rental.status === "Completed") {
      return res.status(400).json({ message: "Cannot update a completed rental." });
    }

    // ✅ Status Transition Rules
    if (status === "Approved" && rental.status !== "Pending") {
      return res.status(400).json({ message: "Only 'Pending' rentals can be approved." });
    }
    else {
      rental.approvedAt = new Date();
    }


    if (status === "In Trip" && rental.status !== "Approved") {
      return res.status(400).json({ message: "Rental must be 'Approved' before moving to 'In Trip'." });
    }

    if (status === "Completed" && rental.status !== "In Trip") {
      return res.status(400).json({ message: "Rental must be 'In Trip' before marking as 'Completed'." });
    }

    if (status === "Rejected") {
      if (rental.status !== "Pending") {
        return res.status(400).json({ message: "Only 'Pending' rentals can be rejected." });
      }
      if (!rejection_message || rejection_message.trim() === "") {
        return res.status(400).json({ message: "Rejection message is required when rejecting a rental." });
      }
      rental.rejection_message = rejection_message; // Store rejection reason
    }

    // Update status
    rental.status = status;

    // If marking as "Completed", set the actual drop-off time
    if (status === "Completed") {
      rental.actualDropOffDateTime = new Date();
    }

    await rental.save({ validateModifiedOnly: true });

    return res.status(200).json({ message: `Rental status updated to ${status}.`, rental });
  } catch (err) {
    next(err);
  }
};


const changeToCancelled = async (req, res, next) => {
  try {
    const { id } = req.params; // Rental ID from URL
    const rental = await Rental.findById(id);

    console.log(rental)

    const user = req.user; // Current logged-in user
    const isCustomer = user.role === 'customer'; // Check if the user is a customer
    const isVendor = user.role === 'vendor'; // Check if the user is a vendor

    const { cancellation_message } = req.body; // Assuming cancellationMessage is passed in the request body

    // Ensure cancellation message is provided
    if (!cancellation_message || cancellation_message.trim() === "") {
      return res.status(400).json({ message: "Cancellation message is required." });
    }

    // Customer can cancel the rental if it's either "Pending" or "Approved"
    if (isCustomer) {
      if (rental.status !== "Pending" && rental.status !== "Approved") {
        return res.status(400).json({ message: "Customer can only cancel a 'Pending' or 'Approved' rental." });
      }

      rental.status = "Cancelled"; // Change status to Cancelled
      rental.cancellation_message = cancellation_message; // Save the cancellation message
      await rental.save();
      return res.status(200).json({ message: "Rental has been cancelled by the customer.", rental });
    }

    // Vendor can cancel only approved rentals, but after 2 hours of approval
    if (isVendor && isRentalVendor) {
      if (rental.status !== "Approved") {
        return res.status(400).json({ message: "Vendor can only cancel an approved rental." });
      }

      const approvalTime = rental.approvedAt; // Assuming `approvedAt` is the time when the rental was approved
      const now = new Date();
      const twoHoursAfterApproval = new Date(approvalTime.getTime() + 2 * 60 * 60 * 1000); // Adding 2 hours to approval time

      // Check if at least 2 hours have passed since the approval
      if (now < twoHoursAfterApproval) {
        return res.status(400).json({ message: "Vendor can only cancel rental after 2 hours of approval." });
      }

      rental.status = "Cancelled"; // Change status to Cancelled
      rental.cancelled_at = new Date();
      rental.cancellation_message = cancellation_message; // Save the cancellation message
      await rental.save();
      return res.status(200).json({ message: "Rental has been cancelled by the vendor.", rental });
    }

  } catch (err) {
    next(err);
  }
};


const getAllPendingRentals = async (req, res, next) => {
  try {

    const pendingRentalList = await Rental.aggregate([
      { $match: { status: "Pending" } }, // Filter rentals with status "Pending"
    
      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object
    
      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
    
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" } // Convert vendor array to object
    ]);
    
    res.status(200).json(pendingRentalList);
    
  }
  catch (err) {
    next(err);
  }
}

const getAllApprovedRentals = async (req, res, next) => {
  try {
    const ApprovedRentalList = await Rental.aggregate([
      { $match: { status: "Approved" } }, // Filter rentals with status "Pending"
    
      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object
    
      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
    
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" } // Convert vendor array to object
    ]);
    
    res.status(200).json(ApprovedRentalList);
  }
  catch (err) {
    next(err)
  }
}

const getAllCancelledRentals = async (req, res, next) => {
  try {
    const CancelledRentalList = await Rental.aggregate([
      { $match: { status: "Cancelled" } }, // Filter rentals with status "Pending"
    
      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object
    
      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
    
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" } // Convert vendor array to object
    ]);
    
    res.status(200).json(CancelledRentalList);

  }
  catch (err) {
    next(err)
  }
}

const getAllRejectedRentals = async (req, res, next) => {
  try {
    const RejectedRentalList = await Rental.aggregate([
      { $match: { status: "Rejected" } }, // Filter rentals with status "Pending"
    
      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object
    
      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
    
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" } // Convert vendor array to object
    ]);
    
    res.status(200).json(RejectedRentalList);

  }
  catch (err) {
    next(err)
  }
}

const getAllInTripRentals = async (req, res, next) => {
  try {
    const InTripRentalList = await Rental.aggregate([
      { $match: { status: "In Trip" } }, // Filter rentals with status "Pending"
    
      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object
    
      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
    
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" } // Convert vendor array to object
    ]);
    
    res.status(200).json(InTripRentalList);
  }
  catch (err) {
    next(err)
  }
}

const getAllCompletedRentals = async (req, res, next) => {
  try {
    const CompletedRentalList = await Rental.aggregate([
      { $match: { status: "Completed" } }, // Filter rentals with status "Pending"
    
      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object
    
      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
    
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" } // Convert vendor array to object
    ]);
    
    res.status(200).json(CompletedRentalList);
  }
  catch (err) {

  }
}

module.exports = {
  createRental,
  changeStatus,
  changeToCancelled,
  getAllApprovedRentals,
  getAllCancelledRentals,
  getAllCompletedRentals,
  getAllInTripRentals,
  getAllPendingRentals,
  getAllRejectedRentals
};
