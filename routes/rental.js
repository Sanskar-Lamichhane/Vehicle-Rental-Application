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
router.put("/api/rental/:id/cancel", verifyToken, isAuthorizeUser, changeToCancelled)

// router.get("/api/rental/pending", verifyToken, isAdmin, getAllPendingRentals)
// router.get("/api/rental/approved", verifyToken, isAdmin, getAllApprovedRentals) 
// router.get("/api/rental/rejected", verifyToken, isAdmin, getAllRejectedRentals)
// router.get("/api/rental/inTrip", verifyToken, isAdmin, getAllInTripRentals)
// router.get("/api/rental/completed", verifyToken, isAdmin, getAllCompletedRentals)
// router.get("/api/rental/cancelled", verifyToken, isAdmin, getAllCancelledRentals)


router.get("/api/rental/:id", verifyToken, isActiveUser, getIndividualRentalDetails )


module.exports = router;