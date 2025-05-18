import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    specialization: {
        type: String,
        required: true,
    },
    hospital: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    experience: {
        type: Number,
        required: true,
    },
    consultationFee: {
        type: Number,
        required: true,
    },
    availability: [{
        // Keep the old day field for backward compatibility
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        // New date fields
        date: {
            type: String, // Store as YYYY-MM-DD format
        },
        displayDate: {
            type: String, // Formatted date for display (e.g., "Mon, Jan 1")
        },
        dayName: {
            type: String, // Full day name (e.g., "Monday")
        },
        slots: [{
            startTime: {
                type: String,
                required: true,
            },
            endTime: {
                type: String,
                required: true,
            },
        }],
    }],
    bio: {
        type: String,
        default: '',
    },
    education: [{
        degree: String,
        institution: String,
        year: Number,
    }],
    certifications: [{
        name: String,
        issuer: String,
        year: Number,
    }],
    languages: [{
        type: String,
    }],
    image: {
        type: String,
        default: 'https://s3.amazonaws.com/images/doctor.png',
    },
}, {
    timestamps: true,
});

// Create a virtual for full availability text
doctorSchema.virtual('availabilityText').get(function() {
    if (!this.availability || this.availability.length === 0) {
        return 'Not available';
    }

    // Handle both old and new format
    const availableDays = this.availability
        .filter(a => a.slots && a.slots.length > 0)
        .map(a => {
            // Use displayDate if available (new format)
            if (a.displayDate) {
                return a.displayDate;
            }

            // Fall back to old format with day names
            const daysMap = {
                'Monday': 'Mon',
                'Tuesday': 'Tue',
                'Wednesday': 'Wed',
                'Thursday': 'Thu',
                'Friday': 'Fri',
                'Saturday': 'Sat',
                'Sunday': 'Sun',
            };
            return daysMap[a.day] || a.day;
        })
        .join(', ');

    return availableDays;
});

// Create a virtual for formatted consultation fee
doctorSchema.virtual('formattedFee').get(function() {
    return `LKR ${this.consultationFee.toLocaleString()}`;
});

// Create a virtual for formatted experience
doctorSchema.virtual('formattedExperience').get(function() {
    return `${this.experience} years experience`;
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;