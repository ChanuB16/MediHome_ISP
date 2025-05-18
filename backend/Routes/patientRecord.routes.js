import express from 'express';
import PatientRecord from '../Models/patientRecord.model.js';

const router = express.Router();

// Get patient record
router.get('/:patientId', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId })
            .populate('patientId', 'username email');

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId)
                .populate('patientId', 'username email');
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Get patient record error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create or update patient record
router.post('/', async (req, res) => {
    try {
        const {
            patientId,
            dateOfBirth,
            bloodType,
            height,
            weight,
            vaccinations,
            allergies,
            medicalHistory,
            medications,
            emergencyContact,
            insurance
        } = req.body;

        let record = await PatientRecord.findOne({ patientId });

        if (record) {
            // Update existing record
            record = await PatientRecord.findOneAndUpdate(
                { patientId },
                {
                    dateOfBirth,
                    bloodType,
                    height,
                    weight,
                    vaccinations,
                    allergies,
                    medicalHistory,
                    medications,
                    emergencyContact,
                    insurance
                },
                { new: true }
            );
        } else {
            // Create new record
            record = new PatientRecord({
                patientId,
                dateOfBirth,
                bloodType,
                height,
                weight,
                vaccinations,
                allergies,
                medicalHistory,
                medications,
                emergencyContact,
                insurance
            });
            await record.save();
        }

        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add vaccination record
router.post('/:patientId/vaccinations', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.vaccinations.push(req.body);
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add vaccination error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add allergy record
router.post('/:patientId/allergies', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.allergies.push(req.body);
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add allergy error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add medical history - support both formats (medical-history and medicalHistory)
router.post('/:patientId/medical-history', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.medicalHistory.push(req.body);
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add medical history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add medical history - alternative endpoint (camelCase)
router.post('/:patientId/medicalHistory', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.medicalHistory.push(req.body);
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add medical history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add medication
router.post('/:patientId/medications', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.medications.push(req.body);
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add medication error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete vaccination record
router.delete('/:patientId/vaccinations/:vaccinationId', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.vaccinations = record.vaccinations.filter(
            v => v._id.toString() !== req.params.vaccinationId
        );
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Delete vaccination error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete allergy record
router.delete('/:patientId/allergies/:allergyId', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.allergies = record.allergies.filter(
            a => a._id.toString() !== req.params.allergyId
        );
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Delete allergy error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add endpoints for deleting medical history records
router.delete('/:patientId/medical-history/:historyId', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.medicalHistory = record.medicalHistory.filter(
            h => h._id.toString() !== req.params.historyId
        );
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Delete medical history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Alternative endpoint for deleting medical history (camelCase)
router.delete('/:patientId/medicalHistory/:historyId', async (req, res) => {
    try {
        // Try to find by patientId field first
        let record = await PatientRecord.findOne({ patientId: req.params.patientId });

        // If not found, try to find by _id
        if (!record && req.params.patientId.match(/^[0-9a-fA-F]{24}$/)) {
            record = await PatientRecord.findById(req.params.patientId);
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Patient record not found",
                patientId: req.params.patientId
            });
        }

        record.medicalHistory = record.medicalHistory.filter(
            h => h._id.toString() !== req.params.historyId
        );
        await record.save();

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Delete medical history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;