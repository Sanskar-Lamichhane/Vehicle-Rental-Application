const express=require("express")
const {isVendor, isSpecificVendor, isCustomer, isActiveUser}=require("../middleware/checkingRole")
const {create,get,fetchingSingleVehicle,updateVehicle, deleteImage, addImage}=require("../controller/vehicleManagement")
const {verifyToken}=require("../controller/auth");
const { giveReviews } = require("../controller/reviews");
const router=express.Router();




router.post("/api/vehicles",verifyToken,isActiveUser,isVendor,create)

router.get("/api/vehicles",get)

router.get("/api/vehicles/:id",fetchingSingleVehicle)

router.put("/api/vehicles/:id", verifyToken, isActiveUser, isSpecificVendor, updateVehicle)

router.delete("/api/vehicles/:id/images/:imageUrl",verifyToken, isActiveUser, isSpecificVendor, deleteImage)

router.put("/api/vehicles/:id/images",verifyToken, isActiveUser, isSpecificVendor, addImage)

router.put("/api/vehicles/:id/reviews", verifyToken, isActiveUser,isCustomer, giveReviews)


module.exports=router;