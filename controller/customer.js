const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");
const mongoose = require("mongoose")




const getCustomerRentalDetails = async (req, res, next) => {
  try {
    const customerId1 = req.user._id; // Get logged-in customer's ID
    const customerId = new mongoose.Types.ObjectId(customerId1);
    const status = req.body.status;

    if (!status) {
      res.status(400).send({
        message: "Status is not present",
      });
    }

    // Define the sorting condition based on the status
    let sortCondition = {};

    if (status === "Pending") {
      sortCondition = { createdAt: -1 }; // Sort by createdAt for "Pending"
    }
    else if (status === "Approved") {
      sortCondition = { approved_at: -1 };
    }
    else if (status === "Rejected") {
      sortCondition = { rejected_at: -1 }; // Sort by rejected_at for "Rejected"
    }
    else if (status === "Cancelled") {
      sortCondition = { cancelled_at: -1 }
    }
    else if (status === "In Trip") {
      sortCondition = { InTrip_at: -1 }
    }
    else if (status === "Completed") {
      sortCondition = { actualCompletionDate: -1 }
    }


    const CustomerRentals = await Rental.aggregate([
      {
        $match: {
          status,
          customer: customerId, // Ensure only this customer's rentals are fetched
        },
      },

      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },

      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      { $unwind: "$vehicle" },

      // Lookup vehicle make details from "brands" collection
      {
        $lookup: {
          from: "brands",
          localField: "vehicle.make",
          foreignField: "_id",
          as: "vehicle.make",
        },
      },
      { $unwind: "$vehicle.make" },

      // Lookup vendor details from "users" collection
      {
        $lookup: {
          from: "users",
          localField: "vehicle.created_by",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },

      // Sort by the createdAt date
      { $sort: sortCondition },

      // Project only necessary fields to shorten the response
      {
        $project: {
          _id: 1,
          status: 1,
          price: 1,
          "customer._id": 1,
          "customer.name": 1,
          "customer.email": 1,
          "vehicle._id": 1,
          "vehicle.model": 1,
          "vehicle.registration_number": 1,
          "vehicle.vehicle_type": 1,
          "vehicle.price_per_day": 1,
          "vehicle.make._id": 1,
          "vehicle.make.brandName": 1,
          "vehicle.color": 1,
          "vehicle.fuel_type": 1,
          "vendor._id": 1,
          "vendor.name": 1,
          "vendor.phoneNumber": 1,
          pickUpDateTime: 1,
          dropOffDateTime: 1,
          pickUpLocation: 1
        },
      },
    ]);

    res.status(200).json(CustomerRentals);
  } catch (err) {
    next(err);
  }
};





module.exports = {
  getCustomerRentalDetails
}


