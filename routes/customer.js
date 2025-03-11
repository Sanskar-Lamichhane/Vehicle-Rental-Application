
const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin } = require("../middleware/checkingRole")
const { verifyToken } = require("../controller/auth")
const router = express.Router();
const {
    getCustomerApprovedRentals,
    getCustomerRejectedRentals,
    getCustomerPendingRentals,
    getCustomerInTripRentals,
    getCustomerCompletedRentals,
    getCustomerCancelledRentals
} = require("../controller/customer")




router.get("/api/customer/rental/pending",verifyToken,  getCustomerPendingRentals)
router.get("/api/customer/rental/approved", verifyToken, getCustomerApprovedRentals)
router.get("/api/customer/rental/rejected", verifyToken, getCustomerRejectedRentals)
router.get("/api/customer/rental/inTrip", verifyToken, getCustomerInTripRentals )
router.get("/api/customer/rental/completed", verifyToken, getCustomerCompletedRentals)
router.get("/api/customer/rental/cancelled", verifyToken, isCustomer, getCustomerCancelledRentals)

module.exports=router;
