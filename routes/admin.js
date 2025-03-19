
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
    getCustomerCancelledRentals,
} = require("../controller/customer")
const {VendorList, CustomerList, getVehiclesNotRentedYet, deleteUnrentedVehicle, toggleUserStatus}=require("../controller/admin");

const { getAllRentalDetails } = require("../controller/rental");




router.get("/api/admin/vendorList", verifyToken, isAdmin, VendorList)
router.get("/api/admin/customerList", verifyToken, isAdmin, CustomerList)
router.get("/api/admin/vehiclesNotRentedYet", verifyToken, isAdmin, getVehiclesNotRentedYet )
router.delete("/api/admin/deleteVehicle/:id", verifyToken, isAdmin, deleteUnrentedVehicle)

router.put("/api/admin/user/:id/status",verifyToken, isAdmin, toggleUserStatus)


router.get("/api/admin/rentalList", verifyToken, isAdmin, getAllRentalDetails)


module.exports=router;