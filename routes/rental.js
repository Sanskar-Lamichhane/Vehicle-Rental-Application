const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin, isAuthorizeUser, isActiveUser } = require("../middleware/checkingRole")
const { create, get, fetchingSingleVehicle, updateVehicle, deleteImage, addImage } = require("../controller/vehicleManagement")
const { verifyToken } = require("../controller/auth")
const router = express.Router();
const {
    createRental,
    changeStatus,
    changeToCancelled,
    getAllApprovedRentals,
    getAllCompletedRentals,
    getAllPendingRentals,
    getAllCancelledRentals,
    getAllRejectedRentals,
    getAllInTripRentals,
    getIndividualRentalDetails
} = require("../controller/rental")


router.post("/api/rental/:id", verifyToken, isCustomer, isActiveUser, createRental)
router.put("/api/rental/:id/status", verifyToken,  isActiveUser, isAuthorizeVendor, changeStatus)
router.put("/api/rental/:id/cancel", verifyToken, isActiveUser, isAuthorizeUser, changeToCancelled)



router.get("/api/rental/:id", verifyToken, getIndividualRentalDetails )


module.exports = router;