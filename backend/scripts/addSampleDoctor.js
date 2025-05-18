import mongoose from 'mongoose';
import Doctor from '../Models/doctor.model.js';
import User from '../Models/user.model.js';

// MongoDB Connection
const URI = "mongodb+srv://it23266582:DSSYuVjt3VRAC43s@medihome.crezc.mongodb.net/?retryWrites=true&w=majority&appName=MediHome";

async function addSampleDoctor() {
    try {
        await mongoose.connect(URI);
        console.log("MongoDB connected!");

        // First, create a user account for the doctor
        const user = new User({
            username: "Dr. Chanuka Bandara",
            email: "chanuka.bandara@example.com",
            password: "hashedPassword123", // In a real app, this would be properly hashed
            isDoctor: true,
            location: "Colombo",
            doctorReg: "GYN12345",
            image: "https://s3.amazonaws.com/images/doctor.png"
        });

        await user.save();
        console.log("User created successfully");

        // Now create the doctor profile
        const doctor = new Doctor({
            userId: user._id,
            name: "Dr. Chanuka Bandara",
            specialization: "Gynecologist",
            hospital: "Asiri Hospital",
            location: "Colombo",
            rating: 4.8,
            reviewCount: 124,
            experience: 12,
            consultationFee: 3500,
            availability: [
                {
                    day: "Monday",
                    slots: [
                        { startTime: "9:00 AM", endTime: "12:00 PM" },
                        { startTime: "2:00 PM", endTime: "5:00 PM" }
                    ]
                },
                {
                    day: "Wednesday",
                    slots: [
                        { startTime: "9:00 AM", endTime: "12:00 PM" },
                        { startTime: "2:00 PM", endTime: "5:00 PM" }
                    ]
                },
                {
                    day: "Friday",
                    slots: [
                        { startTime: "9:00 AM", endTime: "12:00 PM" },
                        { startTime: "2:00 PM", endTime: "5:00 PM" }
                    ]
                }
            ],
            bio: "Dr. Chanuka Bandara is a highly experienced gynecologist with over 12 years of practice. He specializes in women's health and provides comprehensive care for patients of all ages.",
            education: [
                {
                    degree: "MBBS",
                    institution: "University of Colombo",
                    year: 2005
                },
                {
                    degree: "MD in Obstetrics and Gynecology",
                    institution: "Postgraduate Institute of Medicine",
                    year: 2010
                }
            ],
            certifications: [
                {
                    name: "Fellow of the Sri Lanka College of Obstetricians and Gynecologists",
                    issuer: "SLCOG",
                    year: 2012
                }
            ],
            languages: ["Sinhala", "English", "Tamil"],
            image: "https://s3.amazonaws.com/images/doctor.png"
        });

        await doctor.save();
        console.log("Doctor profile created successfully");

        console.log("Sample doctor added successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error adding sample doctor:", error);
        process.exit(1);
    }
}

addSampleDoctor(); 