const Type = require("../model/vehicleType")
const mongoose = require("mongoose")

const createType = async (req, res, next) => {

    try {


        const { categoryName } = req.body;
        const VehicleType = await Type.create({ ...req.body, created_by: req.user._id })
        if (VehicleType) {
            res.status(200).send({
                message: "Vehicle type created successfully!",
                vehicleType: VehicleType
            })
        }
    }
    catch (err) {
        next(err);
    }
}

const fetchType = async (req, res, next) => {
    try {
         
        const vehicleType = await Type.aggregate([
            {
                $lookup:{
                    from: "users",
                    localField:"created_by",
                    foreignField: "_id",
                    as: "created_by"
                }
            },
            {
                $unwind:"$created_by"
            },
            {
                $project:{
                    "created_by._id":1,
                    "created_by.name":1
                }
            }
        ])
        
        res.status(200).send({
            Types: vehicleType
        })

    }
    catch (err) {
        next(err)
    }
}

const updateType = async (req, res, next) => {
    try {
        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
            });
        }

        let type = await Type.findByIdAndUpdate(req.params.id,
            {
                categoryName:req.body.categoryName
            },
            {
                new: true, runValidators: true
            }
        )

        if(!type){
            res.status(404).send({
                message:"Type not found"
            })
        }
        
        res.status(200).send({
            Types:type
        })

    }
    catch (err) {
        next(err)
    }
}


module.exports = { createType, fetchType, updateType }