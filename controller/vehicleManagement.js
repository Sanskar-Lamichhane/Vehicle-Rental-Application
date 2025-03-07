const Vehicle = require("../model/Vehicle");
const path = require("path")
const fs=require('fs')



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
        res.send({ ...vehicle.toObject() })
    }
    catch (err) {
        next(err)
    }
}

const get = async (req, res, next) => {
    try {

        console.log(req.query)

        let search_term = req.query.search_term || "";
        let cat = req.query.cat || "";
        let fuel_type = req.query.fuel_type || "";
        let transmission = req.query.transmission || "";
        let page = parseInt(req.query.page) || 1;
        let per_page = parseInt(req.query.per_page) || 2;

        // Start building the aggregation pipeline
        let vehicles = await Vehicle.aggregate([
            {
                $match:
                {
                    $or: [{ make: RegExp(search_term, "i") },
                    { model: RegExp(search_term, "i") }
                    ]
                }
            },
            // Dynamic filters for category, fuel_type, and transmission
            {
                $match: {
                    $and: [
                        cat ? { vehicle_type: RegExp(cat, "i") } : {},
                        fuel_type ? { fuel_type: RegExp(fuel_type, "i") } : {},
                        transmission ? { transmission: RegExp(transmission, "i") } : {}
                    ]
                }
            },
            {
                $lookup: {
                    from: "users", // Assuming the user data is in the "users" collection
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

                    "created_by.password": 0,
                    "created_by.updatedAt": 0,
                    "created_by.createdAt": 0,
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

const updateVehicle=async(req,res,next)=>{
    try{
        let vehicle=await Vehicle.findByIdAndUpdate(req.params.id,
            {
                make:req.body.make,
                model:req.body.model,
                location:req.body.location,
                year:req.body.year,
                registration_number:req.body.registration_number,
                vehicle_type:req.body.vehicle_type,
                kilometers_per_day:req.body.kilometers_per_day,
                per_extra_kilometer:req.body.per_extra_kilometer,
                price_per_day:req.body.price_per_day,
                currency_type:req.body.currency_type,
                color:req.body.color, 
                capacity:req.body.capacity,
                fuel_type:req.body.petrol,
                transmission:req.body.transmission,
                description:req.body.description,
            

            },
            {
                new:true, runValidators: true
            }
        )

        res.status(200).send(vehicle)

    }
    catch(err){

    }

}

const fetchingSingleVehicle= async(req,res,next)=>{
    try{
        let params1=req.params.id

        let vehicle=await Vehicle.findById(params1)
        console.log(vehicle)
        res.send(vehicle)

    }
    catch(err){
        next(err)

    }
}

const deleteImage=async(req,res,next)=>{

    try{

    
    const {id, imageUrl}=req.params

    const vehicle=await Vehicle.findById(id)
    
    const imageIndex=vehicle.images.indexOf(imageUrl)
    if (imageIndex === -1){
        return res.status(404).json({
            message:"Image not found"
        })
    }
 vehicle.images.splice(imageIndex,1)

 const imagePath=path.join(__dirname, '../uploads/', imageUrl);
 fs.unlinkSync(imagePath);

 await vehicle.save({validateModifiedOnly:true});

 res.json({
    message:"Image removed successfully"
 })
}

catch(err){
    next(err)
}

}

const addImage=async(req,res,next)=>{
      try{
        const {id}=req.params;

        const vehicle= await Vehicle.findById(id);
        
        if(!req.files?.images){
            return res.status(400).json({
                message:"No images uploaded"
            })
        }

        let images=[];

        req.files.images.forEach((img)=>{
            let img_res = Date.now() + '-' + Math.round(Math.random() * 1E9) + img.name;
            img.mv(path.join(__dirname, '../uploads/', img_res));

            // Push the image name into the vehicle's images array
            images.push(img_res);
        })

        vehicle.images.push(...images);
        
        await vehicle.save({validateModifiedOnly:true});

        res.json({
            message:"Images added successfully",
            images:vehicle.images
        })
      }
      catch(err){
        next(err)
      }
}

module.exports = { create, get, updateVehicle, fetchingSingleVehicle, deleteImage, addImage }