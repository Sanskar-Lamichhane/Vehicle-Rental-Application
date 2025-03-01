const Vehicle = require("../model/Vehicle");
const path = require("path")



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
        let vehicle = await Vehicle.create({ ...req.body, images, created_by:req.user._id })
        console.log(vehicle)
        res.send({ ...vehicle.toObject()})
    }
    catch (err) {
        next(err)
    }
}

module.exports={create}