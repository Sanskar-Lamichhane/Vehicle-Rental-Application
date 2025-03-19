const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");
const mongoose = require("mongoose")


const getAllVendorRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId = new mongoose.Types.ObjectId(vendorId1);
        const { status } = req.body;

        if (!status) {
            res.status(400).send({
                message: "No status is sent"
            })
        }

        // Define the sorting condition based on the status
        let sortCondition = {};

        if (status === "Pending") {
            sortCondition = { createdAt: -1 }; // Sort by createdAt for "Pending"
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


        const vendorRentals = await Rental.aggregate([
            {
                $match: { status: status } // ✅ Early filtering by status
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
        
            // ✅ Match vendorId immediately after getting vehicle details
            {
                $match: { "vehicle.created_by": vendorId }
            },
        
            // Lookup vehicle make details from "brands" collection
            {
                $lookup: {
                    from: "brands",
                    localField: "vehicle.make",
                    foreignField: "_id",
                    as: "vehicle.make",
                }
            },
            { $unwind: "$vehicle.make" },
        
            // Lookup vendor details from "users" collection
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" },
        
            // Lookup customer details from "users" collection
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
        
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
                }
            }
        ]);
        
        res.status(200).json(vendorRentals);

    } catch (err) {
        next(err);
    }
}


const getAllVendorVehicles = async (req, res, next) => {
    try {

        const id = new mongoose.Types.ObjectId(req.user._id)

        const vehicles = await Vehicle.aggregate([
            {
                $match: { created_by: id }
            }
        ])

        res.status(200).send({
            vehicles: vehicles
        })
    }
    catch (err) {
        next(err)
    }
}





module.exports = {
    getAllVendorVehicles,
    getAllVendorRentals
}
