const mongoose = require('mongoose');
const User = require("./User");

const notificationSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 500
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['Pending', 'Approved', 'In Trip', 'Completed', 'Cancelled', 'Rejected'],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    }
},
{
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;