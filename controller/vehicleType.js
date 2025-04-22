const Type = require("../model/vehicleType")
const mongoose = require("mongoose")

const createType = async (req, res, next) => {
    try {
        const { categoryName } = req.body;

        // Check if categoryName already exists
        const existingType = await Type.findOne({ categoryName });
        if (existingType) {
            return res.status(400).send({
                message: "Category name is already used"
            });
        }

        const vehicleType = await Type.create({ ...req.body, created_by: req.user._id });

        res.status(200).send({
            message: "Vehicle type created successfully!",
            vehicleType
        });

    } catch (err) {
        next(err);
    }
};


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
                    _id:1,
                    categoryName:1,
                    "created_by._id":1,
                    "created_by.name":1
                }
            }
        ])
        console.log(vehicleType)
        
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
            });
        }

        const { categoryName } = req.body;

        // Check if another document with the same categoryName exists (excluding the current one)
        const existingType = await Type.findOne({ categoryName, _id: { $ne: req.params.id } });
        if (existingType) {
            return res.status(400).send({
                message: "Category name is already used"
            });
        }

        const type = await Type.findByIdAndUpdate(
            req.params.id,
            { categoryName },
            { new: true, runValidators: true }
        );

        if (!type) {
            return res.status(404).send({
                message: "Type not found"
            });
        }

        res.status(200).send({ type });

    } catch (err) {
        next(err);
    }
};


module.exports = { createType, fetchType, updateType }