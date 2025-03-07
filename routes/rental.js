const express=require("express")
const {isVendor, isSpecificVendor, isCustomer}=require("../middleware/checkingRole")
const {create,get,fetchingSingleVehicle,updateVehicle, deleteImage, addImage}=require("../controller/vehicleManagement")
const {verifyToken}=require("../controller/auth")
const router=express.Router();
const {createRental}=require("../controller/rental")


router.post("/api/rental/:id",verifyToken, isCustomer, createRental )


module.exports=router;