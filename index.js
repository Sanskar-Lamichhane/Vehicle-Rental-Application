const express = require("express")
const app = express();
const fileUpload=require("express-fileupload")
const cron = require('node-cron');
require('dotenv').config()
require("./config/database")
const User=require("./model/User")
const Rental=require("./model/Rental")

const auth_routes=require("./routes/auth");
const vehicle_routes=require("./routes/vehicleManagement")
const rental_routes=require("./routes/rental");
const customer_routes=require("./routes/customer")
const vendor_routes=require("./routes/vendor")
const admin_routes=require("./routes/admin")
const brand_routes=require("./routes/brand")
const vehicleType_routes = require("./routes/vehicleType")
const { handleResourceNotFound, handleServerError } = require("./middleware/error");


app.use(fileUpload());
app.use(express.json()) //global middleware






app.use((req,res,next)=>{
    function changeRequest(field){
        console.log(req.files)
        console.log(req.body)
        let temp={};

        if (req[field] !== null && req[field] !== undefined){

        let temp_arr=Object.entries(req[field])
        temp_arr.forEach(el=>{
            if(el[0].endsWith("[]")){
                temp[el[0].slice(0,-2)]=Array.isArray(el[1]) ? el[1]:[el[1]]
            }
            else{
                temp[el[0]] = el[1];
            }
        })
        req[field]=temp
    
    }
}
    
    changeRequest("body")
    changeRequest("files")
    console.log(req.body)
    next()
})



app.use(express.static('uploads'))

// Delete unverified accounts older than 24 hours
cron.schedule('0 * * * *', async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const result = await User.deleteMany({
        isVerified: false,
        createdAt: { $lt: twentyFourHoursAgo },
      });
      console.log(`Deleted ${result.deletedCount} unverified accounts.`);
    } catch (error) {
      console.error('Error deleting unverified accounts:', error);
    }
  });
  
  // Clear expired verification codes (older than 30 minutes)
cron.schedule('*/5 * * * *', async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    try {
      const result = await User.updateMany(
        {
          verificationCode: { $exists: true },
          verificationCodeCreatedAt: { $lt: thirtyMinutesAgo },
        },
        {
          $unset: { verificationCode: 1, verificationCodeCreatedAt: 1 },
        }
      );
      console.log(`Cleared verification codes for ${result.modifiedCount} users.`);
    } catch (error) {
      console.error('Error clearing verification codes:', error);
    }
  });
  


  // Define the cron job to run every 2 minutes
cron.schedule('*/2 * * * *', async() => {
  console.log('Running task every 2 minutes');
  
  // Your task code here (for example, deleting expired rental requests)
  // Call the function to delete expired rental requests, like below:
  await deleteExpiredRentals();
});


// Example function for deleting expired rentals
const deleteExpiredRentals = async () => {
  try {
    // Logic to delete rental requests where the pickup time has passed and status is still "Pending"
    // Replace this with your actual deletion logic
    await Rental.deleteMany({
      pickUpDateTime: { $lt: new Date() },
      status: 'Pending'
    });
    console.log('Expired rental requests deleted.');
  } catch (err) {
    console.error('Error deleting expired rentals:', err);
  }
};


app.use(auth_routes);
app.use(vehicle_routes);
app.use(rental_routes);
app.use(customer_routes);
app.use(vendor_routes);
app.use(admin_routes);
app.use(brand_routes)
app.use(vehicleType_routes)








app.use(handleServerError);
app.use(handleResourceNotFound);







app.listen(3000, () => {
    console.log("Server Started.")
})















