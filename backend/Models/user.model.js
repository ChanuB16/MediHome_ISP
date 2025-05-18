import mongoose from 'mongoose';
const userschema = new mongoose.Schema({
        username:{
            type: String,
            required: true,
        },
        password:{
            type: String,
            required: true,
        },
        email:{
            type: String,
            required: true,
        },
        isDoctor:{
            type: Boolean,
        },
        location:{
            type: String,
            default: "/",
        },
        doctorReg:{
            type: String,
            default: "",
        },
        cimage:{
            type: String,
            default: "https://s3.amazonaws.com/images/doctor.png",
        },
        // Doctor-specific fields
        name: {
            type: String,
        },
        specialization: {
            type: String,
        },
        hospital: {
            type: String,
        },
        consultationFee: {
            type: Number,
        },
        // Additional user profile fields
        phone: {
            type: String,
        },
        address: {
            type: String,
        }
    }, {
        timestamps: true,
    }
);

const user = mongoose.model('User',userschema);
export default user;