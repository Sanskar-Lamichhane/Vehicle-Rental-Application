const {ADMIN, CUSTOMER, VENDOR} = require("../constant");
const Vehicle = require("../model/Vehicle");
const User =require("../model/User");
const Rental = require("../model/Rental");

const isAdmin=(req,res,next)=>{

    const role=req.user.role;

    if (role === ADMIN){
        next();
    }
    else{
        res.status(403).send(
            {
                message:"Access denied! you don't have admin previlage"
            }
        )
    }

}


const isNotVendor=(req,res,next)=>{
    const role=req.user.role;

    if(role=== ADMIN || role===CUSTOMER){
        next();
    }
    else
    {
        res.status(403).send(
            {
                message:"Access denied! only for admin and customers"
            }
        )
    }

}

const isVendor=(req,res,next)=>{
    const role=req.user.role;
    if (role===VENDOR){
        next()
    }
    else{
        res.status(403).send(
            {
                message:"Access denied! you don't have vendor previlege"
            }
        )
    }
}

const isActiveUser=(req,res,next)=>{
    const isActive = req.user.isActive;
    if(isActive){
        next()
    }
    else{
        res.status(403).send({
            message:"You have been locked, so can't access this resource"
        })
    }
}

const isCustomer=(req,res,next)=>{
    const role=req.user.role;
    if(role===CUSTOMER){
        next()
    }
    else{
        res.status(403).send(
            {
                message:"Access denied! you don't have customer previlege"
            }
        )
    }
}

const isSpecificVendor=async(req,res,next)=>{
    try{
    
    const params1=req.params.id;
    const vehicle=await Vehicle.findById(req.params.id);
    if (vehicle)
        {
    if (vehicle.created_by==req.user._id || req.user.role==="admin"){
        next()
    }
    else{
        res.status(403).send(
            {
                message:"Access denied! you are not that specific vendor"
            }
        )
    }
}
else{
    res.status(404).send(
        {
            message:"Product is not found"
        }
    )
}
}
catch(err){
    next(err)
}
}


const isAuthorizeUser=async(req,res,next)=>{
    try{
        const params1=req.params.id;
        const checkRental=await Rental.findById(params1);

        if (checkRental){
            const vehicle=await Vehicle.findById(checkRental.vehicle);
            console.log(vehicle)
            console.log(req.user._id)  
            if (vehicle.created_by==req.user._id || checkRental.customer==req.user._id || req.user.role==="admin"){
                next()
            }
            else{
                res.status(403).send({
                    message:"Access denied! You are not that specific User to use this resource "
                })
            }


        }
        else{
            res.status(404).send({
                message:"Rental Id Not Found"
            })
        }

    }
    catch(err){
        next(err)
    }
}

const isAuthorizeVendor=async(req,res,next)=>{
    try{
        const params1=req.params.id;
        const checkRental=await Rental.findById(params1);

        if (checkRental){
            const vehicle=await Vehicle.findById(checkRental.vehicle);
            console.log(req.user._id)
            if (vehicle.created_by==req.user._id){
                next()
            }
            else{
                res.status(403).send({
                    message:"Access denied! You are not that specific vendor to use this resource "
                })
            }


        }
        else{
            res.status(404).send({
                message:"Rental Id Not Found"
            })
        }

    }
    catch(err){
        next(err)
    }
}







module.exports={isAdmin,isNotVendor,isVendor, isSpecificVendor, isCustomer, isAuthorizeUser, isAuthorizeVendor, isActiveUser}