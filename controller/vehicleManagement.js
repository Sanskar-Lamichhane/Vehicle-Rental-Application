const Vehicle = require("../model/Vehicle");
const path = require("path")
const fs = require('fs');
const mongoose = require('mongoose')
const Rental = require("../model/Rental")




// Create a new vehicle
const create = async (req, res, next) => {
    try {
        console.log(req.files);
        console.log(req.body);
        
        let images = [];
        
        // Process images if any
        if (req.files && req.files.images) {
            // Handle multiple images
            if (Array.isArray(req.files.images)) {
                req.files.images.forEach(img => {
                    let img_res = Date.now() + '-' + Math.round(Math.random() * 1E9) + img.name;
                    img.mv(path.join(__dirname, '../uploads/' + img_res));
                    images.push(img_res);
                });
            } else {
                // Handle single image
                let img = req.files.images;
                let img_res = Date.now() + '-' + Math.round(Math.random() * 1E9) + img.name;
                img.mv(path.join(__dirname, '../uploads/' + img_res));
                images.push(img_res);
            }
        }
        
        // Check if registration number already exists
        const existingRegistration = await Vehicle.findOne({ registration_number: req.body.registration_number });
        if (existingRegistration) {
            return res.status(400).send({ message: "Registration Number is already in use" });
        }
        
        // Check if driver phone number exists (if provided)
        if (req.body.driver && req.body.driver.phoneNumber) {
            const existingDriver = await Vehicle.findOne({ "driver.phoneNumber": req.body.driver.phoneNumber });
            if (existingDriver) {
                return res.status(400).send({ message: "Driver phone number already in use" });
            }
        }
        
        // Create vehicle if validation passes
        let vehicle = await Vehicle.create({ ...req.body, images, created_by: req.user._id });
        console.log(vehicle);
        res.status(200).send({...vehicle.toObject() });
    } catch (err) {
        console.error("Create vehicle error:", err);
        next(err);
    }
};


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
        let per_page = parseInt(req.query.per_page) || 4;
        let sortBy = req.query.sortBy || ""; // Get the sort direction
        let sortField = req.query.sortField || "price_per_day"; // Default sort field if not provided

        let pickDate = req.query.pickDate ? new Date(req.query.pickDate) : null;
        let dropDate = req.query.dropDate ? new Date(req.query.dropDate) : null;

        let availableVehicles = [];

        // Determine sort order
        let sortOrder = sortBy === "asc" ? 1 : -1; // 1 for ascending, -1 for descending

        // Create sort object for aggregation
        let sortObject = {};
        sortObject[sortField] = sortOrder;

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
                    localField: "make",
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "types",
                    localField: "vehicle_type",
                    foreignField: "_id",
                    as: "vehicle_type"
                }
            },
            { $unwind: { path: "$vehicle_type", preserveNullAndEmptyArrays: true } },

            // Dynamic filters for category, fuel_type, and transmission
            {
                $match: {
                    $and: [
                        cat ? { "vehicle_type.categoryName": RegExp(cat, "i") } : {},
                        fuel_type ? { fuel_type: RegExp(fuel_type, "i") } : {},
                        transmission ? { transmission: RegExp(transmission, "i") } : {},
                        city ? { city: RegExp(city, "i") } : {},
                        { "brandDetails.brandName": RegExp(make, "i") },
                        search_term ? {
                            $or: [
                                { "brandDetails.brandName": new RegExp(search_term, "i") },
                                { model: new RegExp(search_term, "i") }
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
            // Add sorting before pagination
            {
                $sort: sortObject
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


// Update an existing vehicle
const updateVehicle = async (req, res, next) => {
    try {
        // Check if params.id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({
                message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
            });
        }
        
        // Check if the vehicle exists
        const existingVehicle = await Vehicle.findById(req.params.id);
        if (!existingVehicle) {
            return res.status(404).send({ message: "Vehicle not found" });
        }
        
        // Check if registration number already exists (but not from this vehicle)
        if (req.body.registration_number && req.body.registration_number !== existingVehicle.registration_number) {
            const regNumberExists = await Vehicle.findOne({ 
                registration_number: req.body.registration_number,
                _id: { $ne: req.params.id }
            });
            
            if (regNumberExists) {
                return res.status(400).send({ message: "Registration Number is already in use" });
            }
        }
        
        // Check if driver phone number exists (but not from this vehicle)
        if (req.body.driver && req.body.driver.phoneNumber && 
            (!existingVehicle.driver || req.body.driver.phoneNumber !== existingVehicle.driver.phoneNumber)) {
            const driverExists = await Vehicle.findOne({ 
                "driver.phoneNumber": req.body.driver.phoneNumber,
                _id: { $ne: req.params.id }
            });
            
            if (driverExists) {
                return res.status(400).send({ message: "Driver phone number already in use" });
            }
        }
        
        // Update vehicle if validation passes
        let vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            {
                make: req.body.make,
                model: req.body.model,
                city: req.body.city,
                year: req.body.year,
                registration_number: req.body.registration_number,
                vehicle_type: req.body.vehicle_type,
                kilometers_per_day: req.body.kilometers_per_day,
                per_extra_kilometer: req.body.per_extra_kilometer,
                price_per_day: req.body.price_per_day,
                currency_type: req.body.currency_type,
                color: req.body.color,
                capacity: req.body.capacity,
                fuel_type: req.body.fuel_type,
                transmission: req.body.transmission,
                description: req.body.description,
                service: req.body.service,
                driver: req.body.driver
            },
            {
                new: true, 
                runValidators: true
            }
        );
        
        res.status(200).send(vehicle);
    } catch (err) {
       
        next(err);
    }
};
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

        res.status(200).json({
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