const Vehicle = require("../model/Vehicle");
const User = require("../model/User"); // Assuming you have a User model
const mongoose = require("mongoose");
const Rental = require("../model/Rental")
const Brand = require("../model/brand")


const createBrand = async (req, res, next) => {

    try {
        req.body.created_by = req.user._id
        const brand = await Brand.create({
            ...req.body
        })

        res.status(200).send({
            message: "Brand successfully created",
            data: brand
        })
    }
    catch (err) {
        next(err)
    }

}

const updateBrand = async (req, res, next) => {
    try {

        let brand = await Brand.findByIdAndUpdate(req.params.id,
            {
                brandName: req.body.brandName,
                yearOfOrigin: req.body.yearOfOrigin,
                countryOfOrigin: req.body.countryOfOrigin
            },
            {
                new: true, runValidators: true
            }
        )

        if (brand) {
            res.status(200).send({
                message: "update successfull",
                brand: brand
            })
        }
    }
    catch (err) {
        next(err)
    }

}


const fetchBrands=async(req,res,next)=>{
try{
    const Brands = await Brand.find({});


    res.status(200).send({
        Brands:Brands
    })
  

  

}
catch(err){
    next(err);
}
}

module.exports = { createBrand, updateBrand, fetchBrands }