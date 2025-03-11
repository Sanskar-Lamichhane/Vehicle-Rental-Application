
const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin } = require("../middleware/checkingRole")
const { verifyToken } = require("../controller/auth")
const router = express.Router();
const {
    getVendorPendingRentals,
    getVendorCancelledRentals,
    getVendorApprovedRentals,
    getVendorRejectedRentals,
    getVendorInTripRentals,
    getVendorCompletedRentals
} = require("../controller/vendor")

router.get("/api/vendor/rental/pending", verifyToken, isVendor, getVendorPendingRentals)
router.get("/api/vendor/rental/approved", verifyToken, isVendor, getVendorApprovedRentals)
router.get("/api/vendor/rental/rejected", verifyToken, isVendor, getVendorRejectedRentals)
router.get("/api/vendor/rental/inTrip", verifyToken, isVendor, getVendorInTripRentals)
router.get("/api/vendor/rental/completed", verifyToken, isVendor, getVendorCompletedRentals)
router.get("/api/vendor/rental/cancelled", verifyToken, isVendor, getVendorCancelledRentals)

module.exports=router;
