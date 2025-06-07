const Vehicle = require("../model/Vehicle");
const Rental = require("../model/Rental");
const mongoose = require("mongoose")
const User= require("../model/User");
const Notification=require("../model/Notification")
const nodemailer = require('nodemailer'); // Add this import at the top

// const createRental = async (req, res, next) => {
//   try {
//     const { price, per_day, pickUpDateTime, dropOffDateTime, journey_details, pickUpLocation, dropOffLocation } = req.body;
//     const customer = req.user._id; // Authenticated user's ID (customer)

//     // Check if params.id is a valid ObjectId (24 hexadecimal characters)
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).send({
//         message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
//       });
//     }

//     // Convert to Date objects
//     const pickUpDate = new Date(pickUpDateTime);
//     const dropOffDate = new Date(dropOffDateTime);
//     const now = new Date();

//     // Validation: Pickup should be at least 2 hours ahead of now
//     if (pickUpDate < new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
//       return res.status(400).json({ message: "Pickup time must be at least 2 hours from now." });
//     }

//     // Validation: Drop-off should be after pickup
//     if (dropOffDate <= pickUpDate) {
//       return res.status(400).json({ message: "Drop-off time must be after the pickup time." });
//     }

//     // Find the vehicle details
//     const vehicleDetails = await Vehicle.findById(req.params.id);
//     if (!vehicleDetails) {
//       return res.status(404).json({ message: "Vehicle not found." });
//     }

//     if (vehicleDetails.service === 'off') {
//       return res.status(403).json({ message: "Vehicle not available as the service is off" })
//     }

//     // Check if the customer already has a rental for any vehicle in the same date range
//     const existingCustomerRental = await Rental.findOne({
//       customer: customer, // Checking rentals for the same customer
//       vehicle: vehicleDetails._id,
//       status: { $nin: ["Completed", "Rejected", "Cancelled"] }, // Ignore completed/cancelled/rejected rentals
//       $and: [
//         { pickUpDateTime: { $lt: dropOffDate } },
//         { dropOffDateTime: { $gt: pickUpDate } }
//       ]
//     });

//     if (existingCustomerRental) {
//       return res.status(400).json({ message: "You already have a rental for this vehicle during this time frame." });
//     }


//     // Check if the vehicle is already rented in the selected time range
//     const overlappingRental = await Rental.findOne({
//       vehicle: vehicleDetails._id,
//       status: { $nin: ["Completed", "Rejected", "Cancelled"] }, // Check only if the rental is active or pending
//       $and: [
//         { pickUpDateTime: { $lt: dropOffDate } },
//         { dropOffDateTime: { $gt: pickUpDate } }
//       ]
//     });

//     if (overlappingRental) {
//       return res.status(400).json({ message: "Vehicle is not available during the selected time frame." });
//     }

//     // Create new rental request
//     const newRental = new Rental({
//       vehicle: vehicleDetails._id,
//       customer: customer,
//       price,
//       per_day,
//       pickUpDateTime: pickUpDate,
//       dropOffDateTime: dropOffDate,
//       status: "Pending",
//       journey_details,
//       pickUpLocation,
//       dropOffLocation
//     });

//     const savedRental = await newRental.save();
//     res.status(201).json({
//       message: "Rental created successfully.",
//       rental: savedRental
//     });
//   } catch (err) {
//     next(err);
//   }
// };


const createRental = async (req, res, next) => {
  try {
    const { price, per_day, pickUpDateTime, dropOffDateTime, journey_details, pickUpLocation, dropOffLocation } = req.body;
    const customer = req.user._id; // Authenticated user's ID (customer)

    // Check if params.id is a valid ObjectId (24 hexadecimal characters)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({
        message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
      });
    }

    // Convert to Date objects
    const pickUpDate = new Date(pickUpDateTime);
    const dropOffDate = new Date(dropOffDateTime);
    const now = new Date();

    // Validation: Pickup should be at least 2 hours ahead of now
    if (pickUpDate < new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
      return res.status(400).json({ message: "Pickup time must be at least 2 hours from now." });
    }

    // Validation: Drop-off should be after pickup
    if (dropOffDate <= pickUpDate) {
      return res.status(400).json({ message: "Drop-off time must be after the pickup time." });
    }

    // Find the vehicle details and populate the vendor information
    const vehicleDetails = await Vehicle.findById(req.params.id).populate('created_by');
    if (!vehicleDetails) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    if (vehicleDetails.service === 'off') {
      return res.status(403).json({ message: "Vehicle not available as the service is off" })
    }

    // Check if the customer already has a rental for any vehicle in the same date range
    const existingCustomerRental = await Rental.findOne({
      customer: customer, // Checking rentals for the same customer
      vehicle: vehicleDetails._id,
      status: { $nin: ["Completed", "Rejected", "Cancelled"] }, // Ignore completed/cancelled/rejected rentals
      $and: [
        { pickUpDateTime: { $lt: dropOffDate } },
        { dropOffDateTime: { $gt: pickUpDate } }
      ]
    });

    if (existingCustomerRental) {
      return res.status(400).json({ message: "You already have a rental for this vehicle during this time frame." });
    }


    // Check if the vehicle is already rented in the selected time range
    const overlappingRental = await Rental.findOne({
      vehicle: vehicleDetails._id,
      status: { $nin: ["Completed", "Rejected", "Cancelled"] }, // Check only if the rental is active or pending
      $and: [
        { pickUpDateTime: { $lt: dropOffDate } },
        { dropOffDateTime: { $gt: pickUpDate } }
      ]
    });

    if (overlappingRental) {
      return res.status(400).json({ message: "Vehicle is not available during the selected time frame." });
    }

    // Create new rental request
    const newRental = new Rental({
      vehicle: vehicleDetails._id,
      customer: customer,
      price,
      per_day,
      pickUpDateTime: pickUpDate,
      dropOffDateTime: dropOffDate,
      status: "Pending",
      journey_details,
      pickUpLocation,
      dropOffLocation
    });

    const savedRental = await newRental.save();

    // Create notification for the vendor
    const vehicleNo = vehicleDetails.registration_number || 'Unknown';
    const vendor = vehicleDetails.created_by;
    let notificationId = null;
    
    if (vendor) {
      const notificationMessage = `Vehicle ${vehicleNo} has a new rental request.`;
      
      const notification = new Notification({
        description: notificationMessage,
        type: 'Pending',
        user: vendor._id
      });
      
      const savedNotification = await notification.save();
      notificationId = savedNotification._id;
    }

    res.status(201).json({
      message: "Rental created successfully.",
      rental: savedRental,
      notification: {
        id: notificationId,
        message: `Vehicle ${vehicleNo} has a new rental request.`
      }
    });
  } catch (err) {
    next(err);
  }
};


// const changeStatus = async (req, res, next) => {
//   try {
//     const { id } = req.params; // Rental ID from URL
//     const { status, rejection_message } = req.body; // New status and optional rejection message
    
//     // Allowed statuses
//     const validStatuses = ["Approved", "In Trip", "Completed", "Rejected"];
    
//     // Check if params.id is a valid ObjectId (24 hexadecimal characters)
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).send({
//         message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
//       });
//     }
    
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: "Invalid status update request." });
//     }
    
//     // Find rental by ID and populate customer and vehicle information
//     // Also populate the created_by field from the vehicle to get vendor information
//     const rental = await Rental.findById(id)
//       .populate('customer')
//       .populate({
//         path: 'vehicle',
//         populate: {
//           path: 'created_by',
//           model: 'User'
//         }
//       });
    
//     if (!rental) {
//       return res.status(404).json({ message: "Rental not found." });
//     }
    
//     // Prevent changes after "Completed"
//     if (rental.status === "Completed") {
//       return res.status(400).json({ message: "Cannot update a completed rental." });
//     }
    
//     // ✅ Status Transition Rules
//     if (status === "Approved" && rental.status !== "Pending") {
//       return res.status(400).json({ message: "Only 'Pending' rentals can be approved." });
//     } else if (status === "Approved") {
//       rental.approvedAt = new Date();
//       rental.approved_at = new Date(); // Setting both for consistency with schema
//     }
    
//     if (status === "In Trip" && rental.status !== "Approved") {
//       return res.status(400).json({ message: "Rental must be 'Approved' before moving to 'In Trip'." });
//     } else if (status === "In Trip") {
//       rental.InTrip_at = new Date();
//     }
    
//     if (status === "Completed" && rental.status !== "In Trip") {
//       return res.status(400).json({ message: "Rental must be 'In Trip' before marking as 'Completed'." });
//     }
    
//     if (status === "Rejected") {
//       if (rental.status !== "Pending") {
//         return res.status(400).json({ message: "Only 'Pending' rentals can be rejected." });
//       }
//       if (!rejection_message || rejection_message.trim() === "") {
//         return res.status(400).json({ message: "Rejection message is required when rejecting a rental." });
//       }
//       rental.rejection_message = rejection_message; // Store rejection reason
//       rental.rejected_at = new Date();
//     }
    
//     // Update status
//     rental.status = status;
    
//     // If marking as "Completed", set the actual drop-off time
//     if (status === "Completed") {
//       rental.actualDropOffDateTime = new Date();
//     }
    
//     await rental.save({ validateModifiedOnly: true });
    
//     // Get vehicle number and vendor information
//     const vehicleNo = rental.vehicle ? rental.vehicle.registration_number || 'Unknown' : 'Unknown';
//     const vendor = rental.vehicle && rental.vehicle.created_by ? rental.vehicle.created_by : null;
    
//     // Create notification for the vendor with only vehicle number (no rental ID)
//     let notificationMessage = '';
    
//     switch (status) {
//       case 'Approved':
//         notificationMessage = `Vehicle ${vehicleNo} has been approved.`;
//         break;
//       case 'In Trip':
//         notificationMessage = `Vehicle ${vehicleNo} has started the trip.`;
//         break;
//       case 'Completed':
//         notificationMessage = `Vehicle ${vehicleNo} has been completed.`;
//         break;
//       case 'Rejected':
//         notificationMessage = `Vehicle ${vehicleNo} has been rejected. Reason: ${rejection_message}`;
//         break;
//       default:
//         notificationMessage = `Vehicle ${vehicleNo} status has been updated to ${status}.`;
//     }
    
//     // Create and save notification if vendor exists
//     let notificationId = null;
    
//     if (vendor) {
//       const notification = new Notification({
//         description: notificationMessage,
//         type: status,
//         user: vendor._id
//       });
      
//       const savedNotification = await notification.save();
//       notificationId = savedNotification._id;
//     }
    
//     // Format response with vehicle number included
//     return res.status(200).json({
//       message: `Rental status updated to ${status}.`,
//       rental: {
//         ...rental.toObject(),
//         vehicleNo: vehicleNo
//       },
//       notification: {
//         id: notificationId,
//         message: notificationMessage
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };


const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // Rental ID from URL
    const { status, rejection_message } = req.body; // New status and optional rejection message
    
    // Allowed statuses
    const validStatuses = ["Approved", "In Trip", "Completed", "Rejected"];
    
    // Check if params.id is a valid ObjectId (24 hexadecimal characters)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
      });
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update request." });
    }
    
    // Find rental by ID and populate customer and vehicle information
    // Also populate the created_by field from the vehicle to get vendor information
    const rental = await Rental.findById(id)
      .populate('customer')
      .populate({
        path: 'vehicle',
        populate: [
          {
            path: 'created_by',
            model: 'User'
          },
          {
            path: 'make',
            model: 'Brand'
          },
          {
            path: 'vehicle_type',
            model: 'Type'
          }
        ]
      });
    
    if (!rental) {
      return res.status(404).json({ message: "Rental not found." });
    }
    
    // Prevent changes after "Completed"
    if (rental.status === "Completed") {
      return res.status(400).json({ message: "Cannot update a completed rental." });
    }
    
    // ✅ Status Transition Rules
    if (status === "Approved" && rental.status !== "Pending") {
      return res.status(400).json({ message: "Only 'Pending' rentals can be approved." });
    } else if (status === "Approved") {
      rental.approvedAt = new Date();
      rental.approved_at = new Date(); // Setting both for consistency with schema
    }
    
    if (status === "In Trip" && rental.status !== "Approved") {
      return res.status(400).json({ message: "Rental must be 'Approved' before moving to 'In Trip'." });
    } else if (status === "In Trip") {
      rental.InTrip_at = new Date();
    }
    
    if (status === "Completed" && rental.status !== "In Trip") {
      return res.status(400).json({ message: "Rental must be 'In Trip' before marking as 'Completed'." });
    }
    
    if (status === "Rejected") {
      if (rental.status !== "Pending") {
        return res.status(400).json({ message: "Only 'Pending' rentals can be rejected." });
      }
      if (!rejection_message || rejection_message.trim() === "") {
        return res.status(400).json({ message: "Rejection message is required when rejecting a rental." });
      }
      rental.rejection_message = rejection_message; // Store rejection reason
      rental.rejected_at = new Date();
    }
    
    // Update status
    rental.status = status;
    
    // If marking as "Completed", set the actual drop-off time
    if (status === "Completed") {
      rental.actualDropOffDateTime = new Date();
    }
    
    await rental.save({ validateModifiedOnly: true });
    
    // Get vehicle number and vendor information
    const vehicleNo = rental.vehicle ? rental.vehicle.registration_number || 'Unknown' : 'Unknown';
    const vendor = rental.vehicle && rental.vehicle.created_by ? rental.vehicle.created_by : null;
    
    // Send email to customer if status is "Approved"
    if (status === "Approved" && rental.customer && rental.customer.email) {
      try {
        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use Gmail or any other email service
            port: 465,
            secure: true,
            auth: {
                user: "lamichhanepower@gmail.com",      // Your email address (store in environment variable)
                pass: "atbo tmsq nwup qbvc",  // Your email password or app password (store in environment variable)
            },
        });

        // Format dates
        const pickupDate = new Date(rental.pickUpDateTime).toLocaleString();
        const dropoffDate = new Date(rental.dropOffDateTime).toLocaleString();

        // Email content
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .success-badge { background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 20px; border: 1px solid #c3e6cb; }
            .details-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; }
            .detail-label { font-weight: bold; color: #495057; }
            .detail-value { color: #212529; }
            .important-info { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7; }
            .contact-section { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Rental Request Approved!</h1>
            </div>
            
            <div class="success-badge">
              <strong>Great News!</strong> Your vehicle rental request has been approved and confirmed.
            </div>

            <div class="details-section">
              <h3>🚗 Vehicle Details</h3>
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">${rental.vehicle.make?.brandName || 'N/A'} ${rental.vehicle.model}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Number:</span>
                <span class="detail-value">${rental.vehicle.registration_number}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Color:</span>
                <span class="detail-value">${rental.vehicle.color}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fuel Type:</span>
                <span class="detail-value">${rental.vehicle.fuel_type}</span>
              </div>
            </div>

            <div class="details-section">
              <h3>📅 Rental Details</h3>
              <div class="detail-row">
                <span class="detail-label">Pickup Date & Time:</span>
                <span class="detail-value">${pickupDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Drop-off Date & Time:</span>
                <span class="detail-value">${dropoffDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${rental.pickUpLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Drop-off Location:</span>
                <span class="detail-value">${rental.dropOffLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">$${rental.price}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Price Per Day:</span>
                <span class="detail-value">$${rental.per_day}</span>
              </div>
            </div>

            <div class="contact-section">
              <h3>📞 Vendor Contact Information</h3>
              <div class="detail-row">
                <span class="detail-label">Vendor Name:</span>
                <span class="detail-value">${vendor?.name || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone Number:</span>
                <span class="detail-value">${vendor?.phoneNumber || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${vendor?.email || 'N/A'}</span>
              </div>
            </div>

            <div class="important-info">
              <strong>⚠️ Important Reminders:</strong>
              <ul>
                <li>Please arrive on time for pickup</li>
                <li>Bring a valid driving license and ID</li>
                <li>Contact the vendor if you need to make any changes</li>
                <li>Inspect the vehicle before taking possession</li>
              </ul>
            </div>

            <div class="footer">
              <p>Thank you for choosing our rental service!</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
        `;

         // Send a success email to the user
        transporter.sendMail({
            from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
            to: rental.customer.email, // recipient's email
            subject: `🎉 Vehicle Rental Approved - ${rental.vehicle.make?.brandName || ''} ${rental.vehicle.model} (${rental.vehicle.registration_number})`,
            html: emailHTML
        });

        console.log(`Approval email sent to ${rental.customer.email}`);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the main operation if email fails
      }
    }
    
    // Create notification for the vendor with only vehicle number (no rental ID)
    let notificationMessage = '';
    
    switch (status) {
      case 'Approved':
        notificationMessage = `Vehicle ${vehicleNo} has been approved.`;
        break;
      case 'In Trip':
        notificationMessage = `Vehicle ${vehicleNo} has started the trip.`;
        break;
      case 'Completed':
        notificationMessage = `Vehicle ${vehicleNo} has been completed.`;
        break;
      case 'Rejected':
        notificationMessage = `Vehicle ${vehicleNo} has been rejected. Reason: ${rejection_message}`;
        break;
      default:
        notificationMessage = `Vehicle ${vehicleNo} status has been updated to ${status}.`;
    }
    
    // Create and save notification if vendor exists
    let notificationId = null;
    
    if (vendor) {
      const notification = new Notification({
        description: notificationMessage,
        type: status,
        user: vendor._id
      });
      
      const savedNotification = await notification.save();
      notificationId = savedNotification._id;
    }
    
    // Format response with vehicle number included
    return res.status(200).json({
      message: `Rental status updated to ${status}.`,
      rental: {
        ...rental.toObject(),
        vehicleNo: vehicleNo
      },
      notification: {
        id: notificationId,
        message: notificationMessage
      }
    });
  } catch (err) {
    next(err);
  }
};

const changeToCancelled = async (req, res, next) => {
  try {
    const { id } = req.params; // Rental ID from URL
    
    // Check if params.id is a valid ObjectId (24 hexadecimal characters)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
      });
    }
    
    // Find rental and populate vehicle information with created_by (vendor)
    const rental = await Rental.findById(id)
      .populate({
        path: 'vehicle',
        populate: {
          path: 'created_by',
          model: 'User'
        }
      });
    
    if (!rental) {
      return res.status(404).json({ message: "Rental not found." });
    }
    
    console.log(rental);
    
    const user = req.user; // Current logged-in user
    const isCustomer = user.role === 'customer'; // Check if the user is a customer
    const isVendor = user.role === 'vendor'; // Check if the user is a vendor
    const isAdmin = user.role === 'admin';
    
    // Check if the vendor is the owner of the vehicle
    const isRentalVendor = isVendor && rental.vehicle && 
      rental.vehicle.created_by && 
      rental.vehicle.created_by._id.toString() === user._id.toString();
    
    const { cancellation_message } = req.body; // Assuming cancellationMessage is passed in the request body
    
    // Ensure cancellation message is provided
    if (!cancellation_message || cancellation_message.trim() === "") {
      return res.status(400).json({ message: "Cancellation message is required." });
    }
    
    // Customer can cancel the rental if it's either "Pending" or "Approved"
    if (isCustomer || isAdmin) {
      if (rental.status !== "Pending" && rental.status !== "Approved") {
        return res.status(400).json({ message: "Customer or admin can only cancel a 'Pending' or 'Approved' rental." });
      }
      
      rental.status = "Cancelled"; // Change status to Cancelled
      rental.cancelled_at = new Date();
      rental.cancellation_message = cancellation_message; // Save the cancellation message
      await rental.save();

      const cust = rental.customer;
      const cust1= await User.findById(cust);

      // Configure the email transporter using Nodemailer
              const transporter = nodemailer.createTransport({
                  service: 'gmail', // Use Gmail or any other email service
                  port: 465,
                  secure: true,
                  auth: {
                      user: "lamichhanepower@gmail.com",      // Your email address (store in environment variable)
                      pass: "atbo tmsq nwup qbvc",  // Your email password or app password (store in environment variable)
                  },
              });
      
              // Send a success email to the user
              transporter.sendMail({
                  from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
                  to: cust1.email, // recipient's email
                  subject: 'Rental Cancellation ❌',
                  text: `❌ Rental has been cancelled by admin - ${rental.vehicle.make?.brandName || ''} ${rental.vehicle.model} (${rental.vehicle.registration_number})`,
              });


      
      // Create notification for the vendor
      const vehicleNo = rental.vehicle ? rental.vehicle.registration_number || 'Unknown' : 'Unknown';
      const vendor = rental.vehicle && rental.vehicle.created_by ? rental.vehicle.created_by : null;
      let notificationId = null;
      
      if (vendor) {
        const notificationMessage = `Vehicle ${vehicleNo} has been cancelled.`;
        
        const notification = new Notification({
          description: notificationMessage,
          type: 'Cancelled',
          user: vendor._id
        });
        
        const savedNotification = await notification.save();
        notificationId = savedNotification._id;
      }
      
      return res.status(200).json({ 
        message: "Rental has been cancelled by the customer.", 
        rental,
        notification: {
          id: notificationId,
          message: `Vehicle ${vehicleNo} has been cancelled.`
        }
      });
    }
    
    // Vendor can cancel only approved rentals, but after 2 hours of approval
    if (isVendor && isRentalVendor) {
      if (rental.status !== "Approved") {
        return res.status(400).json({ message: "Vendor can only cancel an approved rental." });
      }
      
      const approvalTime = rental.approvedAt; // Assuming `approvedAt` is the time when the rental was approved
      const now = new Date();
      const twoHoursAfterApproval = new Date(approvalTime.getTime() + 2 * 60 * 60 * 1000); // Adding 2 hours to approval time
      
      // Check if at least 2 hours have passed since the approval
      if (now < twoHoursAfterApproval) {
        return res.status(400).json({ message: "Vendor can only cancel rental after 2 hours of approval." });
      }
      
      rental.status = "Cancelled"; // Change status to Cancelled
      rental.cancelled_at = new Date();
      rental.cancellation_message = cancellation_message; // Save the cancellation message
      await rental.save();
      
      // Create notification for the vendor
      const vehicleNo = rental.vehicle ? rental.vehicle.registration_number || 'Unknown' : 'Unknown';
      const vendor = rental.vehicle && rental.vehicle.created_by ? rental.vehicle.created_by : null;
      let notificationId = null;
      
      if (vendor) {
        const notificationMessage = `Vehicle ${vehicleNo} has been cancelled.`;
        
        const notification = new Notification({
          description: notificationMessage,
          type: 'Cancelled',
          user: vendor._id
        });
        
        const savedNotification = await notification.save();
        notificationId = savedNotification._id;
      }
      
      return res.status(200).json({ 
        message: "Rental has been cancelled by the vendor.", 
        rental,
        notification: {
          id: notificationId,
          message: `Vehicle ${vehicleNo} has been cancelled.`
        }
      });
    }
    
    return res.status(403).json({ message: "You do not have permission to cancel this rental." });
  } catch (err) {
    next(err);
  }
};



const getAllRentalDetails = async (req, res, next) => {
  try {

    const { status } = req.body;
    if (!status) {
      res.status(400).send({
        message: "No status is sent"
      })
    }

    // Define the sorting condition based on the status
    let sortCondition = {};

    if (status === "Pending") {
      sortCondition = { createdAt: -1 }; // Sort by createdAt for "Pending"
    }
    else if (status === "Approved") {
      sortCondition = { approved_at: -1 };
    }
    else if (status === "Rejected") {
      sortCondition = { rejected_at: -1 }; // Sort by rejected_at for "Rejected"
    }
    else if (status === "Cancelled") {
      sortCondition = { cancelled_at: -1 }
    }
    else if (status === "In Trip") {
      sortCondition = { InTrip_at: -1 }
    }
    else if (status === "Completed") {
      sortCondition = { actualCompletionDate: -1 }
    }


    const RentalList = await Rental.aggregate([
      { $match: { status: status } }, // Filter rentals with status

      // Lookup customer details from "users" collection
      {
        $lookup: {
          from: "users", // Assuming "users" collection stores customer data
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }, // Convert customer array to object

      // Lookup vehicle details from "vehicles" collection
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object

      {
        $lookup: {
          from: "brands",
          localField: "vehicle.make",
          foreignField: "_id",
          as: "vehicle.make"
        }
      },
      { $unwind: "$vehicle.make" }, // Convert brand array to object

      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" }, // Convert vendor array to object

      { $sort: sortCondition }, // Sort by created date (newer first)

      // Project only necessary fields to shorten the response
      {
        $project: {
          _id: 1,
          status: 1,
          price: 1,
          "customer._id": 1,
          "customer.name": 1,
          "customer.email": 1,
          "vehicle._id": 1,
          "vehicle.model": 1,
          "vehicle.registration_number": 1,
          "vehicle.vehicle_type": 1,
          "vehicle.price_per_day": 1,
          "vehicle.make._id": 1,
          "vehicle.make.brandName": 1,
          "vehicle.color": 1,
          "vehicle.fuel_type": 1,
          "vendor._id": 1,
          "vendor.name": 1,
          "vendor.phoneNumber": 1,
          pickUpDateTime: 1,
          dropOffDateTime: 1,
          pickUpLocation: 1,
          dropOffLocation: 1
        },
      },
    ]);

    res.status(200).json(RentalList);


  }
  catch (err) {
    next(err);
  }
}




const getIndividualRentalDetails = async (req, res, next) => {
  try {
    params1 = req.params.id;

    // Check if params.id is a valid ObjectId (24 hexadecimal characters)
    if (!mongoose.Types.ObjectId.isValid(params1)) {
      return res.status(400).send({
        message: "Invalid ObjectId format. Please provide a valid 24-character hexadecimal ID."
      });
    }


    const objectParams = new mongoose.Types.ObjectId(params1);
    console.log(objectParams)

    const individualRentalDetails = await Rental.aggregate([
      {
        $match: { _id: objectParams }
      },
      {
        $lookup: {
          from: "users",
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $lookup: {
          from: "vehicles", // Assuming "vehicles" collection stores vehicle data
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }, // Convert vehicle array to object
      {
        $lookup: {
          from: "types",
          localField: "vehicle.vehicle_type",
          foreignField: "_id",
          as: "vehicle.vehicle_type"
        }
      },
      {
        $unwind: "$vehicle.vehicle_type"
      },
      {
        $lookup: {
          from: "brands",
          localField: "vehicle.make",
          foreignField: "_id",
          as: "vehicle.make"
        }
      },
      { $unwind: "$vehicle.make" }, // Convert brand array to object  
      // Lookup vendor details from "users" collection (assuming vendors are in "users")
      {
        $lookup: {
          from: "users", // Assuming vendors are in "users" collection
          localField: "vehicle.created_by", // Assuming 'created_by' in vehicles refers to vendor
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" }, // Convert vendor array to object
      // Exclude sensitive fields
      {
        $project: {
          "vendor.password": 0,
          "customer.password": 0,
          "customer.createdAt": 0,
          "customer.updatedAt": 0,
          "customer.__v": 0,
          "vendor.__v": 0,
          "vendor.created_by": 0,
          "vehicle.make.created_by": 0,
          "vehicle.make.createdAt": 0,
          "vehicle.make.updatedAt": 0,
          "vehicle.make.__v": 0,
          "vehicle.vehicle_type.created_by": 0,
          "vehicle.vehicle_type.createdAt": 0,
          "vehicle.vehicle_type.updatedAt": 0,
          "vehicle.vehicle_type.__v": 0

        }
      }
    ])

    
   

    res.status(200).send({
      individualRentalDetails
    })
  }
  catch (err) {
    next(err)
  }
}


module.exports = {
  createRental,
  changeStatus,
  changeToCancelled,
  getIndividualRentalDetails,
  getAllRentalDetails
};
