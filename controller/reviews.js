const Vehicle = require("../model/Vehicle");
const User = require("../model/User"); // Assuming you have a User model
const mongoose = require("mongoose");
const Rental = require("../model/Rental")
const Brand = require("../model/brand")


const giveReviews = async (req, res, next) => {
    try {
        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
              return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
              });
            }
        // Check if the user has already reviewed the product
        let exists = await Vehicle.findOne({ _id: req.params.id, "reviews.created_by": req.user._id });

        if (exists) {
            // If the review exists, 
            // update the existing review


            let vehicle = await Vehicle.findOneAndUpdate(
                { _id: req.params.id, "reviews.created_by": req.user._id },
                {
                    $set: {
                        "reviews.$.rating": req.body.rating,
                        "reviews.$.comment": req.body.comment
                    }
                },
                {
                    new: true, // Return the updated document
                    runValidators: true // Ensure validation runs
                }
            );
            res.status(200).json(
                {
                    message:"Review updated successfully",
                vehicle
            });
        } else {
            // If no existing review, add a new review to the product


            let vehicle = await Vehicle.findByIdAndUpdate(
                req.params.id,
                {
                    $push: {
                        reviews: {
                            rating: req.body.rating,
                            created_by: req.user._id, // User who is creating the review
                            comment: req.body.comment
                        }
                    }
                },
                {
                    new: true, // Return the updated document
                    runValidators: true // Ensure validation runs for the new review
                }
            );
            res.status(200).json({
                message: "Reviewed Successfull",
                vehicle
            }
            ); // Send back the updated product with the new review


        }
    } catch (err) {
        next(err); // Pass any errors to the error handler middleware
    }
};

module.exports = { giveReviews }
