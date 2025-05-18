import express from 'express';
import Patient from '../Models/patient.model.js';

const router = express.Router();

// Get patient medical details
router.get('/:id/medical-details', async (req, res) => {
    try {
        console.log('Fetching medical details for patient:', req.params.id);
        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            console.log('Patient not found with ID:', req.params.id);
            return res.status(404).json({ 
                success: false, 
                error: 'Patient not found',
                patientId: req.params.id 
            });
        }

        console.log('Found patient:', patient._id);
        res.json({
            success: true,
            medicalDetails: {
                medicalHistory: patient.medicalHistory || '',
                allergies: patient.allergies || '',
                vaccinations: patient.vaccinations || '',
                currentMedications: patient.currentMedications || '',
                chronicConditions: patient.chronicConditions || ''
            }
        });
    } catch (error) {
        console.error('Error fetching medical details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
            details: error.message 
        });
    }
});

// Update patient medical details
router.put('/:id/medical-details', async (req, res) => {
    try {
        console.log('Updating medical details for patient:', req.params.id);
        console.log('Request body:', req.body);

        console.log('Searching for patient with ID:', req.params.id);
        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            console.log('Patient not found with ID:', req.params.id);
            const allPatients = await Patient.find({}, '_id name');
            console.log('Available patients:', allPatients);
            
            return res.status(404).json({ 
                success: false, 
                error: 'Patient not found',
                patientId: req.params.id,
                availablePatients: allPatients.map(p => ({ id: p._id, name: p.name }))
            });
        }

        console.log('Found patient:', patient._id);
        const { medicalHistory, allergies, vaccinations, currentMedications, chronicConditions } = req.body;

        patient.medicalHistory = medicalHistory;
        patient.allergies = allergies;
        patient.vaccinations = vaccinations;
        patient.currentMedications = currentMedications;
        patient.chronicConditions = chronicConditions;

        await patient.save();
        console.log('Successfully updated medical details for patient:', patient._id);

        res.json({
            success: true,
            message: 'Medical details updated successfully'
        });
    } catch (error) {
        console.error('Error updating medical details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error',
            details: error.message 
        });
    }
});

export default router;
