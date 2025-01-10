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



router.post("/api/signup", async (req, res, next) => {
    console.log(req.body);
    try {
        // let {error}=schema.validate(req.body,{
        //     abortEarly:false,
        //     stripUnknown:false,
        //     allowUnknown:true
        // })

        
        let { error } = schema.validate(req.body, {
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

        let user1 = await User.findOne({email:req.body.email});
        if (user1){
            if (!user1.isVerified){
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                user1.verificationCode = verificationCode;
                await user1.save({validateModifiedOnly:true});

                await transporter.sendMail({
                    from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
                    to: req.body.email, // list of receivers
                    subject: 'Account Verification Code',
                    text: `Your verification code is: ${verificationCode}`,
                  });
                  user1.verificationCode=verificationCode
                  res.status(200).send({ message: "Verification code resent. Please check your email." });
            }
        }
        

        let hashed = await bcrypt.hash(req.body.password, 10);
        console.log(hashed)

        const verificationCode=Math.floor(10000 + Math.random() * 900000).toString()
        
        let user = await User.create({ ...req.body, password: hashed, verificationCode})
        user=user.toObject();
        delete user.verificationCode
        delete user.password;

        
     

        // Compose the email
        // const mailOptions = {
        //     from: process.env.EMAIL_USER,
        //     to: req.body.email,
        //     subject: 'Account Verification Code',
        //     text: `Your verification code is: ${verificationCode}`,
        // };

        console.log(req.body.email)

        const mailOptions = await transporter.sendMail({
            from: '"Sanskar Lamichhane 👻" <lamichhanepower@gmail.com>', // sender address
            to: req.body.email, // list of receivers
            subject: 'Account Verification Code',
            text: `Your verification code is: ${verificationCode}`,
          });


        res.send(user)

    }
    catch (err) {
        next(err)
    }



})

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

router.post("/api/verifyemail", async(req,res,next)=>{
    try {
        // Extract the verification code from the request body
        const { verificationCode } = req.body;
        
        // Find the user in the database using the verification code
        const user = await User.findOne({ verificationCode });
        
      

        // If no user is found or the verification code doesn't match
        if (!user) {
            return res.status(400).send({ message: "Invalid verification code" });
        }

        // If the verification code matches, update the user's `isVerified` field
        user.isVerified = true;
        console.log(user)
        console.log("mello")
        await user.save({validateModifiedOnly: true})

       

        // Respond to the client that the verification was successful
        res.send({ message: "Email verified successfully" });
    } catch (err) {
        next(err);  // Pass any errors to the next error handler
    }
    
})


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




module.exports = router;
