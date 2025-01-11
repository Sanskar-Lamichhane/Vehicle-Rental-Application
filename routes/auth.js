const express = require("express")

const Joi = require("joi");
const User = require("../model/User")
const bcrypt = require('bcrypt')
const jwt=require("jsonwebtoken");
const nodemailer=require("nodemailer")

const router = express.Router();





const schema = Joi.object({
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(30),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

    password_confirmation: Joi.ref('password'),


    email: Joi.string().email()
}).with('password', 'password_confirmation') // Ensures both fields are present
    .messages({
        
        'any.only': 'Password confirmation does not match the password.Please, Match with typed password'
        }
    );



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
    
                    await user1.save({ validateModifiedOnly: true });
    
                    await transporter.sendMail({
                        from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>',
                        to: req.body.email,
                        subject: 'Account Verification Code',
                        text: `Your verification code is: ${verificationCode}`,
                    });
    
                    res.status(200).send({ message: "Verification code resent. Please check your email." });
                    return;
                }
            }
    
            let hashed = await bcrypt.hash(req.body.password, 10);
            console.log(hashed);
    
            const verificationCode = Math.floor(10000 + Math.random() * 900000).toString();
    
            // Hash the verification code
            const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    
            let user = await User.create({ ...req.body, password: hashed, verificationCode: hashedCode });
            user = user.toObject();
            delete user.verificationCode;
            delete user.password;
    
            console.log(req.body.email);
    
            await transporter.sendMail({
                from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>',
                to: req.body.email,
                subject: 'Account Verification Code',
                text: `Your verification code is: ${verificationCode}`,
            });
    
            res.send(user);
    
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
        const user = await User.findOne({ email, isVerified: false });

        if (!user) {
            return res.status(400).send({ message: "Invalid email or the user is already verified." });
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
                return res.status(429).send({
                    message: `You have reached the resend limit. Please wait ${remainingTime} minutes before trying again.`,
                });
            }

            // Reset the attempts after cooldown
            userLimit.attempts = 0;
        }

        // Generate a new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        await user.save({validateModifiedOnly:true});

        // Configure the email transporter using Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use Gmail or any other email service
            port:465,
            secure:true,
            auth: {
                user: "lamichhanepower@gmail.com",      // Your email address (store in environment variable)
                pass: "atbo tmsq nwup qbvc",  // Your email password or app password (store in environment variable)
            },
        });

        await transporter.sendMail({
            from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
            to: req.body.email, // list of receivers
            subject: 'Account Verification Code',
            text: `Your verification code is: ${verificationCode}`,
          });

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
            return res.status(400).send({ message: "Invalid email or verification code." });
        }

        // Update the user's `isVerified` field
        user.isVerified = true;
        user.verificationCode = undefined; // Clear the code after verification
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
        await transporter.sendMail({
            from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
            to: user.email, // recipient's email
            subject: 'Account Successfully Verified',
            text: `Hello ${user.name},\n\nYour email address has been successfully verified. You can now log in to your account.\n\nBest regards,\nSanskar Lamichhane\n CEO, HamroGadi`,
        });

        // Respond to the client that the verification was successful
        res.send({ message: "Email verified successfully. A confirmation email has been sent." });

    } catch (err) {
        next(err);  // Pass any errors to the next error handler
    }
});


router.post("/api/login", async (req, res,next) => {
    // 1. take password and email
    // 2. check if user exists
    // 3. check password


    try {
        let { error } = loginSchema.validate(req.body, {
            abortEarly: false,   // Don't stop after the first validation error; collect all errors
            stripUnknown: false, // Don't remove unknown keys from the validated value
            allowUnknown: true    // Allow unknown keys in the input
        })



        console.log("error:", error?.details)

        if (error?.details) { 
            res.status(400).send({

                errors: error?.details

            })
            return;
        }

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

                let userObj=user.toObject();
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

        res.status(401).send({
            msg: "Invalid credentials"
        })



    }
    catch (err) {
        next(err)
    }
})


// Joi schema for password reset
const resetPasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
    newPassword: Joi.string()
        .required()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
    confirmPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
            "any.only": "Confirm password does not match the new password.",
        }),
});

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token
    if (!token) {
        return res.status(401).send({ message: "Authorization token is required." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to request object
        next();
    } catch (err) {
        res.status(403).send({ message: "Invalid or expired token." });
    }
};

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

        res.send({ message: "Password reset successfully." });
    } catch (err) {
        next(err);
    }
});

// Joi schema for name change
const changeNameSchema = Joi.object({
    newName: Joi.string().alphanum().min(3).max(30).required(),
});

// Change Name API
router.post("/api/changeName", verifyToken, async (req, res, next) => {
    try {
        const { newName } = req.body;

        // Validate the request body
        const { error } = changeNameSchema.validate({ newName });
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        // Find the user using the token's payload (user info)
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        // Update the user's name
        user.name = newName;
        await user.save({ validateModifiedOnly: true });

        res.send({ message: "Name updated successfully." });
    } catch (err) {
        next(err);
    }
});







module.exports = router;
