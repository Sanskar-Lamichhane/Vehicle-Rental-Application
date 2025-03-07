const express=require("express")
const {isVendor, isSpecificVendor}=require("../middleware/checkingRole")
const {create,get,fetchingSingleVehicle,updateVehicle, deleteImage, addImage}=require("../controller/vehicleManagement")
const {verifyToken}=require("../controller/auth")
const router=express.Router();




router.post("/api/vehicles",verifyToken,isVendor,create)

router.get("/api/vehicles",get)

router.get("/api/vehicles/:id",fetchingSingleVehicle)

router.put("/api/vehicles/:id", verifyToken, isSpecificVendor, updateVehicle)

router.delete("/api/vehicles/:id/images/:imageUrl",verifyToken, isSpecificVendor, deleteImage)

router.put("/api/vehicles/:id/images",verifyToken, isSpecificVendor, addImage)


module.exports=router;