const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendOtp(phoneNumber, otp) {
    try {


        const message = await client.messages.create({
            body: `Your OTP code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });

        console.log('OTP sent:', message.sid);
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Could not send OTP');
    }
}

module.exports = { sendOtp };
