const express = require("express")
const cron = require('node-cron');
const Joi = require("joi");
const User = require("../model/User")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")
const { sendOtp } = require('../utils/Twilia');
const { isAdmin, isNotVendor } = require("../middleware/checkingRole")
const router = express.Router();
const { verifyToken } = require("../controller/auth")





const schema = Joi.object({
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(30),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-={}|;:,.<>?~`]+$'))
        .min(6)  // Ensure at least 6 characters
        .required(),

    password_confirmation: Joi.ref('password'),

    email: Joi.string().email(),

    phoneNumber: Joi.string()
        .pattern(new RegExp('^\\+9779[0-9]{9}$')) // Validates phone number starting with +9779 and followed by 9 digits
        .required()
        .messages({
            'string.pattern.base': 'Phone number must start with +9779 and be followed by 9 digits',
        })

}).with('password', 'password_confirmation') // Ensures both fields are present
    .messages({
        'any.only': 'Password confirmation does not match the password. Please, match with typed password'
    });


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



const crypto = require('crypto');

router.post("/api/signup", async (req, res, next) => {
    console.log(req.body);
    try {
        let { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: false,
            allowUnknown: true
        });

        console.log("error:", error?.details);

        if (error?.details) {
            res.status(400).send({
                errors: error?.details
            });
            return;
        }



        // Configure the email transporter using Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 465,
            secure: true,
            auth: {
                user: "lamichhanepower@gmail.com",
                pass: "atbo tmsq nwup qbvc",
            },
        });

        let user1 = await User.findOne({ email: req.body.email });
        if (user1) {
            if (!user1.isVerified) {
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

                // Hash the verification code
                const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
                user1.verificationCode = hashedCode;
                user1.name = req.body.name;
                user1.password = req.body.password;
                user1.phoneNumber = req.body.phoneNumber

                await user1.save({ validateModifiedOnly: true });

                try {


                    await transporter.sendMail({
                        from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>',
                        to: req.body.email,
                        subject: 'Account Verification Code',
                        text: `Your verification code is: ${verificationCode}`,
                    });


                    res.status(200).send({ message: "Verification code resent. Please check your email." });
                    return;
                }
                catch (err) {
                    res.status(502).send({
                        message: "Failed to send the code in email"
                    })
                }
            }
        }

        let hashed = await bcrypt.hash(req.body.password, 10);


        const verificationCode = Math.floor(10000 + Math.random() * 900000).toString();

        // Hash the verification code
        const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
        req.body.role = "customer"

        // Create a new user instance
        let user = new User({
            ...req.body,
            password: hashed,
            verificationCode: hashedCode
            // Do not include isPhoneNumberVerified, it will use the default value
        });


        // Save the user to the database
        await user.save();


        user = user.toObject();
        delete user.verificationCode;
        delete user.password;


        try {


            await transporter.sendMail({
                from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>',
                to: req.body.email,
                subject: 'Account Verification Code',
                text: `Your verification code is: ${verificationCode}`,
            });

            res.status(200).send(user);
        }
        catch (err) {
            res.status(502).send({
                message: "Failed to send code in email"
            })
        }

    } catch (err) {
        next(err);
    }
});

const loginSchema = Joi.object({
    password: Joi.string().required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

    email: Joi.string().email().required()
})

const rateLimiter = new Map(); // Store the resend attempts and timestamps


router.post("/api/resendEmail", async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find the user in the database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: "User with this email is not found in our system" });
        }

        // Check the resend attempts for the user
        const now = Date.now();
        const userLimit = rateLimiter.get(email) || { attempts: 0, lastAttempt: 0 };

        // Enforce the cooldown period if the limit is reached
        if (userLimit.attempts >= 3) {
            const timeSinceLastAttempt = now - userLimit.lastAttempt;
            const cooldownTime = 10 * 60 * 1000; // 10 minutes in milliseconds

            if (timeSinceLastAttempt < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - timeSinceLastAttempt) / 1000 / 60); // Convert to minutes
                return res.status(400).send({
                    message: `You have reached the resend limit. Please wait ${remainingTime} minutes before trying again.`,
                });
            }

            // Reset the attempts after cooldown
            userLimit.attempts = 0;
        }

        // Generate a new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Hash the submitted verification code
        const hashedSubmittedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
        user.verificationCode = hashedSubmittedCode;
        await user.save({ validateModifiedOnly: true });

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

        try {


            await transporter.sendMail({
                from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
                to: req.body.email, // list of receivers
                subject: 'Account Verification Code',
                text: `Your verification code is: ${verificationCode}`,
            });
        }
        catch (err) {
            res.status(502).send("Email Resent is not working properly")
        }

        // Update the rate limiter
        userLimit.attempts += 1;
        userLimit.lastAttempt = now;
        rateLimiter.set(email, userLimit);

        res.status(200).send({ message: "Verification code resent successfully." });
    }
    catch (err) {
        next(err);
    }
});

router.post("/api/verifyemail", async (req, res, next) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).send({ message: "Email and verification code are required." });
        }

        // Hash the submitted verification code
        const hashedSubmittedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

        // Find the user by email and hashed verification code
        const user = await User.findOne({ email, verificationCode: hashedSubmittedCode });

        if (!user) {
            return res.status(400).send({ message: "Invalid verification code." });
        }

        // Update the user's `isVerified` field
        user.isVerified = true;
        // user.verificationCode = undefined; // Clear the code after verification
        // user.verificationCodeCreatedAt=undefined;

        user.verificationCode = undefined;
        user.verificationCodeCreatedAt = undefined;
        user.isPhoneNumberVerified = undefined;

        await user.save({ validateModifiedOnly: true });

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
            to: user.email, // recipient's email
            subject: 'Account Successfully Verified',
            text: `Hello ${user.name},\n\nYour email address has been successfully verified. You can now log in to your account.\n\nBest regards,\nSanskar Lamichhane\n CEO, HamroGadi`,
        });

        // Respond to the client that the verification was successful
        res.status(200).send({
            message: "Email verified successfully. A confirmation email has been sent.",
            user
        });

    } catch (err) {
        next(err);  // Pass any errors to the next error handler
    }
});


router.post("/api/login", async (req, res, next) => {
    // 1. take password and email
    // 2. check if user exists
    // 3. check password


    try {

        let user = await User.findOne({ email: req.body.email }).select("+password")


        if (user) {

            // Check if the user is verified
            if (!user.isVerified) {
                return res.status(403).send({
                    msg: "Please verify your email before logging in."
                });
            }

            console.log(user)

            let matched = await bcrypt.compare(req.body.password, user.password);
            if (matched) {

                let userObj = user.toObject();
                delete userObj.password

                let token = jwt.sign(userObj, process.env.JWT_SECRET);
                res.send({
                    msg: "login successful",
                    token

                })
                console.log(process.env.JWT_SECRET)
                return;
            }

        }

        res.status(400).send({
            message: "Invalid credentials"
        })



    }
    catch (err) {
        next(err)
    }
})


// Joi schema for password reset
const resetPasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-={}|;:,.<>?~`]+$'))
        .min(6)  // Ensure at least 6 characters
        .required(),
    newPassword: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-={}|;:,.<>?~`]+$'))
        .min(6)  // Ensure at least 6 characters
        .required(),
    confirmPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
            "any.only": "Confirm password does not match the new password.",
        }),
});


// Reset Password API
router.post("/api/resetPassword", verifyToken, async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate the request body
        const { error } = resetPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        // Find the user using the token's payload (user info)
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        // Verify the current password
        const isMatched = await bcrypt.compare(currentPassword, user.password);
        if (!isMatched) {
            return res.status(400).send({ message: "Current password is incorrect." });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save({ validateModifiedOnly: true });

        res.status(200).send({ message: "Password reset successfully." });
    } catch (err) {
        next(err);
    }
});

// Joi schema for name and phone number change
const changeNamePhoneSchema = Joi.object({
    newName: Joi.string().alphanum().min(3).max(30).required(),

    newPhoneNumber: Joi.string()
        .pattern(new RegExp('^\\+9779[0-9]{9}$')) // Validates phone number starting with +9779 and followed by 9 digits
        .required()
        .messages({
            'string.pattern.base': 'Phone number must start with +9779 and be followed by 9 digits',
        }),
});

// Change Name and Phone API
router.post("/api/changeNamePhone", verifyToken, async (req, res, next) => {
    try {
        const { newName, newPhoneNumber } = req.body;

        // Validate the request body
        const { error } = changeNamePhoneSchema.validate({ newName, newPhoneNumber });
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        // Find the user using the token's payload (user info)
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        // Update the user's name and phone number
        user.name = newName;
        user.phoneNumber = newPhoneNumber;
        await user.save({ validateModifiedOnly: true });

        res.send(
            {
                message: "Name and phone number updated successfully.",
                data: user
            });

    } catch (err) {
        next(err);
    }
});




// Joi schema for validating forget password email
const emailSchema = Joi.object({
    email: Joi.string().email().required(),
});

// Joi schema for setting a new password
const setPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    verificationCode: Joi.string().required(),
    newPassword: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-={}|;:,.<>?~`]+$'))
        .min(6)  // Ensure at least 6 characters
        .required(),
    confirmPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
            "any.only": "Confirm password does not match the new password.",
        }),
});

// Forget Password - Send Verification Code
router.post("/api/forgetPassword", async (req, res, next) => {
    try {
        const { email } = req.body;

        // Validate email
        const { error } = emailSchema.validate({ email });
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: "Please, check the email and try again" });
        }

        // Generate a verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = crypto.createHash("sha256").update(verificationCode).digest("hex");

        // Save the hashed code
        user.verificationCode = hashedCode;
        await user.save({ validateModifiedOnly: true });

        try {


            // Send email with verification code
            await transporter.sendMail({
                from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>',
                to: email,
                subject: "Password Reset Verification Code",
                text: `Your verification code is: ${verificationCode}`,
            });
        }
        catch (err) {
            res.status(500).send({
                message: "Failed to send code in email"
            })
        }
        res.status(200).send({ message: "Verification code sent successfully to your email." });
    } catch (err) {
        next(err);
    }
});

// Verify Code and Set New Password
router.post("/api/setNewPassword", async (req, res, next) => {
    try {
        const { email, verificationCode, newPassword, confirmPassword } = req.body;

        // Validate request body
        const { error } = setPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: "User with the email not found" });
        }

        // Check if the verification code is valid
        const hashedCode = crypto.createHash("sha256").update(verificationCode).digest("hex");
        if (user.verificationCode !== hashedCode) {
            return res.status(400).send({ message: "Invalid verification code." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the verification code
        user.password = hashedPassword;
        user.verificationCode = undefined; // Clear the code after verification
        user.verificationCodeCreatedAt = undefined;
        await user.save({ validateModifiedOnly: true });

        // Generate JWT token for immediate authentication
        const userObj = user.toObject();
        delete userObj.password; // Exclude password from token payload
        const token = jwt.sign(userObj, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).send({
            message: "Password updated successfully. You are now authenticated.",
            token,
        });
    } catch (err) {
        next(err);
    }
});



// Vendor Registration Route
router.post("/api/vendorRegistration", verifyToken, isAdmin, async (req, res, next) => {


    try {
        let { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: false,
            allowUnknown: true
        });

        console.log("error:", error?.details);

        if (error?.details) {
            res.status(400).send({
                errors: error?.details
            });
            return;
        }



        const { name, email, password, phoneNumber, password_confirmation } = req.body;
        req.body.role = "vendor";
        // // Ensure the phone number is provided
        // if (!phoneNumber) {
        //     return res.status(400).json({ message: "Phone number is required" });
        // }

        // Hash the password before saving it
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new vendor
        const newVendor = new User({
            name,
            email,
            password: hashedPassword,
            role: req.body.role,
            phoneNumber,
            isVerified: true, // Assuming vendors are verified directly by admin
        });

        newVendor.verificationCodeCreatedAt = undefined;

        // Save the vendor to the database
        await newVendor.save();

        // Respond with the created vendor (excluding the password)
        res.status(200).json({
            message: "Vendor registered successfully",
            vendor: {
                name: newVendor.name,
                email: newVendor.email,
                role: newVendor.role,
                phoneNumber: newVendor.phoneNumber,
                isVerified: newVendor.isVerified
            }
        });

    } catch (err) {
        next(err);
    }
});

router.get("/api/user/me", verifyToken, async (req, res, next) => {
    try {


        const userDetails = await User.findOne({ _id: req.user._id });

        if (userDetails) {
            res.status(200).send({
                _id: userDetails._id,
                name: userDetails.name,
                email: userDetails.email,
                phoneNumber: userDetails.phoneNumber,
                role: userDetails.role
            })
        }
        else {
            res.status(404).send({
                message: "User not found"
            })
        }
    }
    catch (err) {
        next(err)
    }
})










module.exports = router;
