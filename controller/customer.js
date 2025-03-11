const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");
const mongoose=require("mongoose")

const getCustomerPendingRentals = async (req, res, next) => {
    try {
        const customerId1 = req.user._id; // Get logged-in customer's ID
        const customerId=new mongoose.Types.ObjectId(customerId1)
        
        const customerPendingRentals = await Rental.aggregate([
            { 
                $match: { 
                    status: "Pending", 
                    customer: customerId // Ensure only this customer's rentals are fetched
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

            // Lookup vehicle details from "vehicles" collection
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" }, 

            // Lookup vendor details from "users" collection
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by", 
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" } 
        ]);

        res.status(200).json(customerPendingRentals);
        
    } catch (err) {
        next(err);
    }
};


const getCustomerApprovedRentals = async (req, res, next) => {
    try {
        const customerId1 = req.user._id; // The authenticated customer's ID
        const customerId=new mongoose.Types.ObjectId(customerId1);

        const approvedRentals = await Rental.aggregate([
            { 
                $match: { 
                    status: "Approved", 
                    customer: customerId 
                } 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" }
        ]);

        if (approvedRentals.length === 0) {
            return res.status(404).json({ message: "No approved rentals found for this customer." });
        }

        res.status(200).json(approvedRentals);
    } catch (err) {
        next(err);
    }
};


const getCustomerCancelledRentals = async (req, res, next) => {
    try {
        const customerId1 = req.user._id;
        const customerId = new mongoose.Types.ObjectId(customerId1)

        const cancelledRentals = await Rental.aggregate([
            { 
                $match: { 
                    status: "Cancelled", 
                    customer: customerId 
                } 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" }
        ]);


        res.status(200).json(cancelledRentals);
    } catch (err) {
        next(err);
    }
};


const getCustomerRejectedRentals = async (req, res, next) => {
    try {
        const customerId1 = req.user._id;
        const customerId=new mongoose.Types.ObjectId(customerId1)

        const rejectedRentals = await Rental.aggregate([
            { 
                $match: { 
                    status: "Rejected", 
                    customer: customerId 
                } 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" }
        ]);

        res.status(200).json(rejectedRentals);
    } catch (err) {
        next(err);
    }
};


const getCustomerCompletedRentals = async (req, res, next) => {
    try {
        const customerId1 = req.user._id;

        // Convert string customerId to ObjectId for comparison
        const customerId = new mongoose.Types.ObjectId(customerId1);

        const completedRentals = await Rental.aggregate([
            { 
                $match: { 
                    status: "Completed", 
                    customer: customerId 
                } 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" }
        ]);

        console.log(completedRentals)

        res.status(200).json(completedRentals);
    } catch (err) {
        next(err);
    }
};


const getCustomerInTripRentals = async (req, res, next) => {
    try {
        const customerId1 = req.user._id;
        const customerId= new mongoose.Types.ObjectId(customerId1)

        const inTripRentals = await Rental.aggregate([
            { 
                $match: { 
                    status: "In-Trip", 
                    customer: customerId 
                } 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $lookup: {
                    from: "users",
                    localField: "vehicle.created_by",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" }
        ]);


        res.status(200).json(inTripRentals);
    } catch (err) {
        next(err);
    }
};


module.exports={
    getCustomerApprovedRentals,
    getCustomerCancelledRentals,
    getCustomerCompletedRentals,
    getCustomerInTripRentals,
    getCustomerPendingRentals,
    getCustomerRejectedRentals
}


