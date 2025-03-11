const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin } = require("../middleware/checkingRole")
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
    getAllInTripRentals
} = require("../controller/rental")


router.post("/api/rental/:id", verifyToken, isCustomer, createRental)
router.put("/api/rental/:id/status", verifyToken, isAuthorizeVendor, changeStatus)
router.put("/api/rental/:id/cancel", verifyToken, isAuthorizeVendor, changeToCancelled)

router.get("/api/rental/pending", verifyToken, isAdmin, getAllPendingRentals)
router.get("/api/rental/approved", verifyToken, isAdmin, getAllApprovedRentals) 
router.get("/api/rental/rejected", verifyToken, isAdmin, getAllRejectedRentals)
router.get("/api/rental/inTrip", verifyToken, isAdmin, getAllInTripRentals)
router.get("/api/rental/completed", verifyToken, isAdmin, getAllCompletedRentals)
router.get("/api/rental/cancelled", verifyToken, isAdmin, getAllCancelledRentals)


module.exports = router;