import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    // ... existing fields ...
    
    // Medical Details
    medicalHistory: {
        type: String,
        default: ''
    },
    allergies: {
        type: String,
        default: ''
    },
    vaccinations: {
        type: String,
        default: ''
    },
    currentMedications: {
        type: String,
        default: ''
    },
    chronicConditions: {
        type: String,
        default: ''
    }
    
    // ... rest of the schema ...
});

export default mongoose.model('Patient', patientSchema); 