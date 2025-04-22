const mongoose = require('mongoose');
const User = require("./User")

const brandSchema = new mongoose.Schema({
    brandName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 30,
        validate: {
            validator: async function (value) {
                console.log(this._id)
                let count = await mongoose.models.Brand.countDocuments({ brandName : value ,_id: { $ne: this._id }});
                if (count) {
                    return false;
                }
                return true;
            },
            message: "Brand name already used"
        }

    },
    countryOfOrigin: {
        type: String,
        enum: ["australia", "usa", "france", "germany", "india", "china", "japan"],
        required: true,
        set: function (value) {
            if(value){
            return value.toLowerCase();
            }
        }
    },
    yearOfOrigin: {
        type: String,
        required: true,
        min: 4,
        max: 4
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    }
},
    {
        timestamps: true  // Automatically adds createdAt and updatedAt fields
    });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
