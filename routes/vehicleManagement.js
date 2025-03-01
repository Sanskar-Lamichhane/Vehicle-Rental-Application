const express=require("express")
const {isVendor}=require("../middleware/checkingRole")
const {create}=require("../controller/vehicleManagement")
const {verifyToken}=require("../controller/auth")
const router=express.Router();



router.post("/api/createVehicle",verifyToken,isVendor,create)


module.exports=router;