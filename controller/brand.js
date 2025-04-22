const Vehicle = require("../model/Vehicle");
const User = require("../model/User"); // Assuming you have a User model
const mongoose = require("mongoose");
const Rental = require("../model/Rental")
const Brand=require("../model/brand")


const createBrand = async (req, res, next) => {
    try {
        req.body.created_by = req.user._id;

        // Check if the brand name already exists
        const existingBrand = await Brand.findOne({ brandName: req.body.brandName });
        if (existingBrand) {
            return res.status(400).json({ message: "Brand name already used" });
        }

        // Proceed with creation
        const brand = await Brand.create(req.body);

        res.status(201).send({
            message: "Brand successfully created",
            data: brand
        });
    } catch (err) {
        next(err);
    }
};


const updateBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { brandName, yearOfOrigin, countryOfOrigin } = req.body;

        // Check if another document with the same name exists (excluding the current one)
        const existingBrand = await Brand.findOne({ brandName, _id: { $ne: id } });
        if (existingBrand) {
            return res.status(400).json({ message: "Brand name already used" });
        }

        // Proceed with the update
        let brand = await Brand.findByIdAndUpdate(id,
            { brandName, yearOfOrigin, countryOfOrigin },
            { new: true, runValidators: true }
        );

        if (brand) {
            res.status(200).send({
                message: "Update successful",
                brand: brand
            });
        } else {
            res.status(404).json({ message: "Brand not found" });
        }
    } catch (err) {
        next(err);
    }
};



const fetchBrands=async(req,res,next)=>{
try{
    // const Brands = await Brand.find({});

    const Brands= await Brand.aggregate([
        {
            $lookup:{
                from:"users",
                foreignField:"_id",
                localField:"created_by",
                as:"created_by"
            }
        },
        {
            $project:{
                brandName:1,
                countryOfOrigin:1,
                yearOfOrigin:1,
                "created_by.name":1
            }
        }
    ])

    res.status(200).send({
        Brands:Brands
    })
  

  

}
catch(err){
    next(err);
}
}

module.exports = { createBrand, updateBrand, fetchBrands }