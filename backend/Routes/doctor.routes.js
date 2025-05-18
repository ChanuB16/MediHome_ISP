import express from 'express';
import Doctor from '../Models/doctor.model.js';
import User from '../Models/user.model.js';

const router = express.Router();

// Get all doctors
router.get('/all', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'email');
        res.status(200).json({
            success: true,
            data: doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Search doctors by specialization or location
router.get('/search', async (req, res) => {
    try {
        const { specialization, location, hospital } = req.query;
        const query = {};

        if (specialization) query.specialization = specialization;
        if (location) query.location = location;
        if (hospital) query.hospital = hospital;

        const doctors = await Doctor.find(query).populate('userId', 'email');
        res.status(200).json({
            success: true,
            data: doctors
        });
    } catch (error) {
        console.error('Error searching doctors:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get doctor by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        // Try to find existing doctor profile
        let doctor = await Doctor.findOne({ userId: req.params.userId });

        // If doctor profile doesn't exist but user is a doctor, create a profile
        if (!doctor) {
            const user = await User.findById(req.params.userId);

            if (user && user.isDoctor) {
                console.log("Creating doctor profile for user:", user._id);

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

                // Get registration data from user model if available
                const registrationData = {
                    name: user.name || user.username,
                    specialization: user.specialization || (user.doctorReg ? `Medical Doctor (${user.doctorReg})` : "General Practitioner"),
                    hospital: user.hospital || "General Hospital",
                    consultationFee: user.consultationFee || 2000,
                };

                console.log("Using registration data:", registrationData);

                // Create doctor profile with registration data or default values
                doctor = new Doctor({
                    userId: user._id,
                    name: registrationData.name,
                    specialization: registrationData.specialization,
                    hospital: registrationData.hospital,
                    location: user.location || "Sri Lanka",
                    experience: 1, // Default value
                    consultationFee: registrationData.consultationFee,
                    availability: defaultAvailability,
                    bio: `Dr. ${registrationData.name} is a ${registrationData.specialization} specialist at ${registrationData.hospital}.`,
                    image: user.cimage || "https://s3.amazonaws.com/images/doctor.png" // Use user image or default
                });

                await doctor.save();
                console.log("Doctor profile created:", doctor._id);
            } else {
                return res.status(404).json({ success: false, error: 'Doctor not found' });
            }
        }

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        console.error('Error fetching or creating doctor profile:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Create a new doctor profile
router.post('/create', async (req, res) => {
    try {
        const {
            userId,
            name,
            specialization,
            hospital,
            location,
            experience,
            consultationFee,
            availability,
            bio,
            education,
            certifications,
            languages,
            image
        } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if doctor profile already exists
        const existingDoctor = await Doctor.findOne({ userId });
        if (existingDoctor) {
            return res.status(400).json({ success: false, error: 'Doctor profile already exists' });
        }

        // Create new doctor profile
        const doctor = new Doctor({
            userId,
            name,
            specialization,
            hospital,
            location,
            experience,
            consultationFee,
            availability,
            bio,
            education,
            certifications,
            languages,
            image
        });

        await doctor.save();

        // Update user's isDoctor status and image
        user.isDoctor = true;
        if (image) {
            user.cimage = image;
        }
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Doctor profile created successfully',
            data: doctor
        });
    } catch (error) {
        console.error('Error creating doctor profile:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('userId', 'email');
        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update doctor profile
router.put('/:id', async (req, res) => {
    try {
        const {
            name,
            specialization,
            hospital,
            location,
            experience,
            consultationFee,
            availability,
            bio,
            education,
            certifications,
            languages,
            image
        } = req.body;

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Update fields
        if (name) doctor.name = name;
        if (specialization) doctor.specialization = specialization;
        if (hospital) doctor.hospital = hospital;
        if (location) doctor.location = location;
        if (experience) doctor.experience = experience;
        if (consultationFee) doctor.consultationFee = consultationFee;
        if (availability) doctor.availability = availability;
        if (bio) doctor.bio = bio;
        if (education) doctor.education = education;
        if (certifications) doctor.certifications = certifications;
        if (languages) doctor.languages = languages;
        if (image) {
            doctor.image = image;

            // Also update the user's cimage field
            const user = await User.findById(doctor.userId);
            if (user) {
                user.cimage = image;
                await user.save();
            }
        }

        await doctor.save();

        res.status(200).json({
            success: true,
            message: 'Doctor profile updated successfully',
            data: doctor
        });
    } catch (error) {
        console.error('Error updating doctor profile:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Delete doctor profile
router.delete('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Update user's isDoctor status
        const user = await User.findById(doctor.userId);
        if (user) {
            user.isDoctor = false;
            await user.save();
        }

        await Doctor.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Doctor profile deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting doctor profile:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;