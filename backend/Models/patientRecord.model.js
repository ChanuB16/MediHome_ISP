import mongoose from 'mongoose';

const vaccinationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    provider: {
        type: String,
        required: true
    },
    nextDueDate: {
        type: Date
    },
    notes: String
});

const allergySchema = new mongoose.Schema({
    allergen: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe'],
        required: true
    },
    reaction: String,
    notes: String
});

const patientRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    vaccinations: [vaccinationSchema],
    allergies: [allergySchema],
    medicalHistory: [{
        condition: String,
        diagnosisDate: Date,
        status: {
            type: String,
            enum: ['Active', 'Resolved', 'Chronic'],
            required: true
        },
        notes: String
    }],
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
        prescribedBy: String,
        notes: String
    }],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        email: String
    },
    insurance: {
        provider: String,
        policyNumber: String,
        groupNumber: String,
        expiryDate: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
patientRecordSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);

export default PatientRecord; 