const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");
const mongoose=require("mongoose")

const getVendorPendingRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId=new mongoose.Types.ObjectId(vendorId1)
        
        const vendorPendingRentals = await Rental.aggregate([
            {
                $lookup:{
                    from: "vehicles",
                    localField:"vehicle",
                    foreignField:"_id",
                    as:"vehicle"
                }
            },
            {
                $unwind:"$vehicle"
            },
            {
                $lookup:{
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind:"$vendor"
            },
            { 
                $match: { 
                    status: "Pending", 
                    "vendor.created_by":vendorId// Ensure only this customer's rentals are fetched
                } 
            },

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

        ]);

        res.status(200).json(vendorPendingRentals);
        
    } catch (err) {
        next(err);
    }
};


const getVendorCancelledRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId=new mongoose.Types.ObjectId(vendorId1)
        
        const vendorCancelledRentals = await Rental.aggregate([
            {
                $lookup:{
                    from: "vehicles",
                    localField:"vehicle",
                    foreignField:"_id",
                    as:"vehicle"
                }
            },
            {
                $unwind:"$vehicle"
            },
            {
                $lookup:{
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind:"$vendor"
            },
            { 
                $match: { 
                    status: "Cancelled", 
                    "vendor._id":vendorId// Ensure only this customer's rentals are fetched
                } 
            },

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

        ]);

        res.status(200).json(vendorCancelledRentals);
        
    } catch (err) {
        next(err);
    }
};


const getVendorRejectedRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId=new mongoose.Types.ObjectId(vendorId1)
        
        const vendorRejectedRentals = await Rental.aggregate([
            {
                $lookup:{
                    from: "vehicles",
                    localField:"vehicle",
                    foreignField:"_id",
                    as:"vehicle"
                }
            },
            {
                $unwind:"$vehicle"
            },
            {
                $lookup:{
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind:"$vendor"
            },
            { 
                $match: { 
                    status: "Rejected", 
                    "vendor._id":vendorId// Ensure only this customer's rentals are fetched
                } 
            },

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

        ]);

        res.status(200).json(vendorRejectedRentals);
        
    } catch (err) {
        next(err);
    }
};


const getVendorInTripRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId=new mongoose.Types.ObjectId(vendorId1)
        
        const vendorInTripRentals = await Rental.aggregate([
            {
                $lookup:{
                    from: "vehicles",
                    localField:"vehicle",
                    foreignField:"_id",
                    as:"vehicle"
                }
            },
            {
                $unwind:"$vehicle"
            },
            {
                $lookup:{
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind:"$vendor"
            },
            { 
                $match: { 
                    status: "In Trip", 
                    "vendor._id":vendorId// Ensure only this customer's rentals are fetched
                } 
            },

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

        ]);

        res.status(200).json(vendorInTripRentals);
        
    } catch (err) {
        next(err);
    }
};


const getVendorApprovedRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId=new mongoose.Types.ObjectId(vendorId1)
        
        const vendorApprovedRentals = await Rental.aggregate([
            {
                $lookup:{
                    from: "vehicles",
                    localField:"vehicle",
                    foreignField:"_id",
                    as:"vehicle"
                }
            },
            {
                $unwind:"$vehicle"
            },
            {
                $lookup:{
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind:"$vendor"
            },
            { 
                $match: { 
                    status: "Approved", 
                    "vendor._id":vendorId// Ensure only this customer's rentals are fetched
                } 
            },

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

        ]);

        res.status(200).json(vendorApprovedRentals);
        
    } catch (err) {
        next(err);
    }
};


const getVendorCompletedRentals = async (req, res, next) => {
    try {
        const vendorId1 = req.user._id; // Get logged-in customer's ID
        const vendorId=new mongoose.Types.ObjectId(vendorId1)
        
        const vendorCompletedRentals = await Rental.aggregate([
            {
                $lookup:{
                    from: "vehicles",
                    localField:"vehicle",
                    foreignField:"_id",
                    as:"vehicle"
                }
            },
            {
                $unwind:"$vehicle"
            },
            {
                $lookup:{
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind:"$vendor"
            },
            { 
                $match: { 
                    status: "Completed", 
                    "vendor._id":vendorId// Ensure only this customer's rentals are fetched
                } 
            },

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

        ]);

        res.status(200).json(vendorCompletedRentals);
        
    } catch (err) {
        next(err);
    }
};





module.exports={
    getVendorPendingRentals,
    getVendorCancelledRentals,
    getVendorApprovedRentals,
    getVendorInTripRentals,
    getVendorRejectedRentals,
    getVendorCompletedRentals
}
