import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    reason: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    patientLocation: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        default: 0
    },
    flags: [{
        type: {
            type: String,
            enum: ['warning', 'info', 'success', 'error'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
}, {
    timestamps: true,
});

// Add index for efficient querying
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 });
appointmentSchema.index({ reference: 1 }, { unique: true });

// Pre-save middleware to set the amount from doctor's consultation fee
appointmentSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('doctorId')) {
        try {
            const Doctor = mongoose.model('Doctor');
            const doctor = await Doctor.findById(this.doctorId);
            if (doctor) {
                this.amount = doctor.consultationFee;
            }
        } catch (error) {
            console.error('Error setting appointment amount:', error);
        }
    }
    next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;