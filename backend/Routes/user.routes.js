import express from 'express';
import mongoose from 'mongoose';
import User from "../Models/user.model.js";
import Doctor from "../Models/doctor.model.js";

const router = express.Router();

router.post('/register', async (req, res) => {
    const {
        username,
        email,
        password,
        isDoctor,
        location,
        doctorReg,
        // Doctor specific fields
        name,
        specialization,
        hospital,
        consultationFee
    } = req.body;

    if (!username || !password || !email) {
        if(isDoctor === false) {
            if(!location){
                return res.status(400).json({ success: false, error: "Please provide all the fields" });
            }
        }
        if(isDoctor === true) {
            if(!doctorReg || !name || !specialization || !hospital || !consultationFee){
                return res.status(400).json({ success: false, error: "Please provide all the doctor fields" });
            }
        }
    }

    const orCondition=[{email:email}];

    if(doctorReg){
        orCondition.push({doctorReg:doctorReg});
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({$or:orCondition});
        if (existingUser) {
            return res.status(409).json({ success: false, error: "User already exists" });
        }

        // Create a new user
        const newUser = new User({
            username,
            email,
            password,
            isDoctor,
            location,
            doctorReg
        });
        await newUser.save();

        // If this is a doctor, create a doctor profile
        if (isDoctor) {
            try {
                // Create default availability for weekdays and weekends
                const defaultAvailability = [
                    { day: 'Monday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                    { day: 'Tuesday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                    { day: 'Wednesday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                    { day: 'Thursday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                    { day: 'Friday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                    { day: 'Saturday', slots: [{ startTime: '08:00', endTime: '13:00' }] },
                    { day: 'Sunday', slots: [] } // No slots for Sunday
                ];

                // Create doctor profile
                const doctorProfile = new Doctor({
                    userId: newUser._id,
                    name: name || username, // Use name if provided, otherwise use username
                    specialization,
                    hospital,
                    location: location || "Sri Lanka",
                    experience: 1, // Default value
                    consultationFee: parseFloat(consultationFee),
                    availability: defaultAvailability,
                    bio: `Dr. ${name || username} is a ${specialization} specialist at ${hospital}.`,
                    image: "https://s3.amazonaws.com/images/doctor.png" // Default image
                });

                await doctorProfile.save();
                console.log("Doctor profile created successfully:", doctorProfile._id);
            } catch (doctorError) {
                console.error("Error creating doctor profile:", doctorError);
                // We don't want to fail the registration if doctor profile creation fails
                // But we should log it for debugging
            }
        }

        res.status(201).json({ success: true, message: "User Registration successful", data: newUser });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: `Server error ${e}` });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Please enter email and password" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        // Convert the user document to a plain object and ensure _id is included
        const userData = {
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            isDoctor: user.isDoctor,
            location: user.location,
            doctorReg: user.doctorReg,
            image: user.cimage, // Use cimage field from user model
            // Include doctor-specific fields if they exist
            name: user.name,
            specialization: user.specialization,
            hospital: user.hospital,
            consultationFee: user.consultationFee
        };

        // If user is a doctor, fetch or create doctor profile
        if (user.isDoctor) {
            try {
                // Try to find existing doctor profile
                let doctorProfile = await Doctor.findOne({ userId: user._id });

                // If doctor profile doesn't exist, create one
                if (!doctorProfile) {
                    console.log("Creating default doctor profile during login for user:", user._id);

                    // Create default availability for weekdays and weekends
                    const defaultAvailability = [
                        { day: 'Monday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                        { day: 'Tuesday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                        { day: 'Wednesday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                        { day: 'Thursday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                        { day: 'Friday', slots: [{ startTime: '08:00', endTime: '17:00' }] },
                        { day: 'Saturday', slots: [{ startTime: '08:00', endTime: '13:00' }] },
                        { day: 'Sunday', slots: [] } // No slots for Sunday
                    ];

                    // Create doctor profile with default values
                    doctorProfile = new Doctor({
                        userId: user._id,
                        name: user.username,
                        specialization: user.doctorReg ? `Medical Doctor (${user.doctorReg})` : "General Practitioner",
                        hospital: "General Hospital",
                        location: user.location || "Sri Lanka",
                        experience: 1, // Default value
                        consultationFee: 2000, // Default value
                        availability: defaultAvailability,
                        bio: `Dr. ${user.username} is a medical professional.`,
                        image: user.cimage || "https://s3.amazonaws.com/images/doctor.png" // Use user image or default
                    });

                    await doctorProfile.save();
                    console.log("Default doctor profile created during login:", doctorProfile._id);
                }

                // Add complete doctor profile data to the response
                userData.doctorProfile = doctorProfile.toObject();

                // Update user image if doctor has an image
                if (doctorProfile.image) {
                    userData.image = doctorProfile.image;
                }
            } catch (doctorError) {
                console.error("Error fetching/creating doctor profile during login:", doctorError);
                // Don't fail the login if doctor profile fetch fails
            }
        }

        res.status(200).json({ success: true, message: "Login successful", data: userData });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: `Server error ${e}` });
    }
});
router.get('/getusers', async (req, res) => {
    try{
        const users = await User.find({});
        res.status(200).json({success: true, data: users});
    }
    catch(e){
        console.error(e);
        res.status(500).json({error: e});
    }
});

router.post('/forgetPass', async (req, res) => {
    const { email, newPsw } = req.body;

    if (!email || !newPsw) {
        return res.status(400).json({ success: false, error: "Please enter email and password" });
    }

    try{
        const user=await User.findOne({email});

        if(!user){
            return res.status(401).json({ success: false, error: "Invalid email" });
        }

        if (user.password === newPsw) {
            return res.status(401).json({ success: false, error: "Password already exists" });
        }
        await User.findOneAndUpdate({email}, {password: newPsw})
        res.status(201).json({ success: true, message: "Password updated successfully" });
    }catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: `Server error ${e}` });
    }
});

// Update user profile picture
router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { image } = req.body;

        // Validate image URL
        if (!image) {
            return res.status(400).json({ success: false, error: "Image URL is required" });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Update user profile picture
        // Only update cimage since that's the field defined in the User model
        console.log(`Updating profile picture for user ${userId} to: ${image}`);
        user.cimage = image;
        await user.save();

        // If user is a doctor, also update the doctor profile picture
        if (user.isDoctor) {
            try {
                const doctorProfile = await Doctor.findOne({ userId: userId });
                if (doctorProfile) {
                    doctorProfile.image = image;
                    await doctorProfile.save();
                    console.log("Doctor profile picture updated successfully");
                }
            } catch (doctorError) {
                console.error("Error updating doctor profile picture:", doctorError);
                // Don't fail the user update if doctor profile update fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            data: user
        });
    } catch (error) {
        console.error("Error updating user profile picture:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Delete user account
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Check if user is a doctor - only allow deletion for patients
        if (user.isDoctor) {
            return res.status(403).json({
                success: false,
                error: "Doctor accounts cannot be deleted through this interface. Please contact support."
            });
        }

        console.log(`Deleting user account for user ${userId}`);

        // Delete user's appointments
        try {
            // We need to import the Appointment model
            const Appointment = mongoose.model('Appointment');
            await Appointment.deleteMany({ userId: userId });
            console.log(`Deleted appointments for user ${userId}`);
        } catch (appointmentError) {
            console.error("Error deleting user appointments:", appointmentError);
            // Continue with user deletion even if appointment deletion fails
        }

        // Delete user's medical records if they exist
        try {
            // We need to import the MedicalRecord model
            const MedicalRecord = mongoose.model('MedicalRecord');
            await MedicalRecord.deleteMany({ userId: userId });
            console.log(`Deleted medical records for user ${userId}`);
        } catch (recordError) {
            console.error("Error deleting user medical records:", recordError);
            // Continue with user deletion even if medical record deletion fails
        }

        // Finally, delete the user
        await User.findByIdAndDelete(userId);
        console.log(`User ${userId} deleted successfully`);

        res.status(200).json({
            success: true,
            message: "User account deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export { router as default };