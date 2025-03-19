const Vehicle = require("../model/Vehicle");
const path = require("path")
const fs = require('fs');
const mongoose = require('mongoose')



const create = async (req, res, next) => {

    console.log(req.files)
    console.log(req.body)

    let images = []


    req.files?.images?.forEach(img => {
        let img_res = Date.now() + '-' + Math.round(Math.random() * 1E9) + img.name;
        img.mv(path.join(__dirname, '../uploads/' + img_res))
        images.push(img_res)
    })

    try {
        // let product=await Product.create({...req.body, created_by:req.user_id});
        console.log(req.body)
        let vehicle = await Vehicle.create({ ...req.body, images, created_by: req.user._id })
        console.log(vehicle)
        res.status(200).send({ ...vehicle.toObject() })
    }
    catch (err) {
        next(err)
    }
}

const get = async (req, res, next) => {
    try {
        console.log(req.query);

        let search_term = req.query.search_term || "";
        let cat = req.query.cat || "";
        let fuel_type = req.query.fuel_type || "";
        let transmission = req.query.transmission || "";
        let city = req.query.city || "";
        let make = req.query.make || "";
        let page = parseInt(req.query.page) || 1;
        let per_page = parseInt(req.query.per_page) || 2;

        let pickDate = req.query.pickDate ? new Date(req.query.pickDate) : null;
        let dropDate = req.query.dropDate ? new Date(req.query.dropDate) : null;

        let availableVehicles = [];

        // Step 1: Check if both pickDate and dropDate are provided
        if (pickDate && dropDate) {
            // Step 2: Find unavailable vehicle IDs
            const unavailableVehicles = await Rental.find({
                status: { $nin: ["Completed", "Rejected", "Cancelled"] },
                $or: [
                    { pickUpDateTime: { $lt: dropDate }, dropOffDateTime: { $gt: pickDate } }
                ]
            }).distinct("vehicle");

            // Step 3: Filter out unavailable vehicles
            availableVehicles = await Vehicle.find({ _id: { $nin: unavailableVehicles }, service: "on" }).distinct("_id");

            // Step 4: If no vehicles are available, return an empty array immediately
            if (availableVehicles.length === 0) {
                return res.status(200).json([]);
            }
        }

        // Step 5: Proceed with aggregation (No date filtering here)
        let vehicles = await Vehicle.aggregate([
            {
                $match: {
                    ...(pickDate && dropDate ? { _id: { $in: availableVehicles } } : {})
                }
            },
            // Lookup for brands collection to get the brand details
            {
                $lookup: {
                    from: "brands",
                    localField: "make",  // Assuming 'make' field in vehicles stores the brand ID
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } },

            // Dynamic filters for category, fuel_type, and transmission
            {
                $match: {
                    $and: [
                        cat ? { vehicle_type: RegExp(cat, "i") } : {},
                        fuel_type ? { fuel_type: RegExp(fuel_type, "i") } : {},
                        transmission ? { transmission: RegExp(transmission, "i") } : {},
                        city ? { city: RegExp(city, "i") } : {},
                        { "brandDetails.brandName": RegExp(make, "i") },
                        search_term ? {
                            $or: [
                                { "brandDetails.brandName": new RegExp(search_term, "i") }, // Search by brand name
                                { model: new RegExp(search_term, "i") } // Search by model
                            ]
                        } : {}
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "created_by"
                }
            },
            {
                $unwind: "$created_by"
            },
            {
                $project: {
                    "created_by": 0,
                    "reviews": 0,
                    "driver": 0,
                    "createdAt": 0,
                    "updatedAt": 0,
                    "brandDetails.createdAt": 0,
                    "brandDetails.updatedAt": 0,
                    "brandDetails.countryOfOrigin": 0,
                    "brandDetails.yearOfOrigin": 0,
                    "__v": 0,
                    "brandDetails.__v": 0
                }
            },
            {
                $facet: {
                    meta_data: [
                        { $count: "total" },
                        { $addFields: { page, per_page } }
                    ],
                    data: [
                        { $skip: ((page - 1) * per_page) },
                        { $limit: per_page }
                    ]
                }
            },
            {
                $unwind: "$meta_data"
            }
        ]);

        res.send(vehicles);
    } catch (err) {
        next(err);
    }
};



const updateVehicle = async (req, res, next) => {
    try {

        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
              return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
              });
            }
        let vehicle = await Vehicle.findByIdAndUpdate(req.params.id,
            {
                make: req.body.make,
                model: req.body.model,
                location: req.body.location,
                year: req.body.year,
                registration_number: req.body.registration_number,
                vehicle_type: req.body.vehicle_type,
                kilometers_per_day: req.body.kilometers_per_day,
                per_extra_kilometer: req.body.per_extra_kilometer,
                price_per_day: req.body.price_per_day,
                currency_type: req.body.currency_type,
                color: req.body.color,
                capacity: req.body.capacity,
                fuel_type: req.body.petrol,
                transmission: req.body.transmission,
                description: req.body.description,
                service: req.body.service,


            },
            {
                new: true, runValidators: true
            }
        )

        res.status(200).send(vehicle)

    }
    catch (err) {

    }

}

const fetchingSingleVehicle = async (req, res, next) => {
    try {
        let params1 = req.params.id

        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
            if (!mongoose.Types.ObjectId.isValid(params1)) {
              return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
              });
            }

        let vehicle = await Vehicle.findById(params1)
        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
        if (!mongoose.Types.ObjectId.isValid(params1)) {
            return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
            });
        }
        const objectParams = new mongoose.Types.ObjectId(params1);

        if (vehicle) {
            const fetchVehicle = await Vehicle.aggregate([
                {
                    $match: { _id: objectParams }
                },
                {
                    $lookup:{
                        from : "types",
                        localField : "vehicle_type",
                        foreignField : "_id",
                        as : "vehicle_type"
                    }
                },
                {
                    $unwind : "$vehicle_type"
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "created_by",
                        foreignField: "_id",
                        as: "created_by"
                    }
                },
                { $unwind: "$created_by" },
                {
                    $project: {
                        "created_by._id": 1,
                        "created_by.email": 1,
                        "created_by.phoneNumber": 1,
                        "vehicle_type.categoryName":1,
                        "vehicle_type._id":1

                    }
                }
            ])
        }
        else {
            res.status(404).send({
                message: "vehicle not found"
            })
        }

        res.status(200).send({
            vehicle : vehicle
        })

    }
    catch (err) {
        next(err)

    }
}

const deleteImage = async (req, res, next) => {

    try {


        const { id, imageUrl } = req.params

        // Check if params.id is a valid ObjectId (24 hexadecimal characters)
            if (!mongoose.Types.ObjectId.isValid(id)) {
              return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
              });
            }

        const vehicle = await Vehicle.findById(id)
        

        const imageIndex = vehicle.images.indexOf(imageUrl)
        if (imageIndex === -1) {
            return res.status(404).json({
                message: "Image not found"
            })
        }
        vehicle.images.splice(imageIndex, 1)

        const imagePath = path.join(__dirname, '../uploads/', imageUrl);
        fs.unlinkSync(imagePath);

        await vehicle.save({ validateModifiedOnly: true });

        res.staus(200).json({
            message: "Image removed successfully"
        })
    }

    catch (err) {
        next(err)
    }

}

const addImage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findById(id);

        if (!req.files?.images) {
            return res.status(400).json({
                message: "No images uploaded"
            })
        }

        let images = [];

        req.files.images.forEach((img) => {
            let img_res = Date.now() + '-' + Math.round(Math.random() * 1E9) + img.name;
            img.mv(path.join(__dirname, '../uploads/', img_res));

            // Push the image name into the vehicle's images array
            images.push(img_res);
        })

        vehicle.images.push(...images);

        await vehicle.save({ validateModifiedOnly: true });

        res.json({
            message: "Images added successfully",
            images: vehicle.images
        })
    }
    catch (err) {
        next(err)
    }
}



module.exports = { create, get, updateVehicle, fetchingSingleVehicle, deleteImage, addImage }