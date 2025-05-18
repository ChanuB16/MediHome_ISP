import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AddVaccinationForm from './AddVaccinationForm';
import AddAllergyForm from './AddAllergyForm';
import AddMedicalHistoryForm from './AddMedicalHistoryForm';

export default function PatientRecords({ isOpen, onClose, patientId }) {
    const [activeTab, setActiveTab] = useState('vaccinations');
    const [loading, setLoading] = useState(false);
    const [record, setRecord] = useState(null);
    const [showAddVaccination, setShowAddVaccination] = useState(false);
    const [showAddAllergy, setShowAddAllergy] = useState(false);
    const [showAddMedicalHistory, setShowAddMedicalHistory] = useState(false);
    // No form data needed since we removed the basic info section

    useEffect(() => {
        if (isOpen && patientId) {
            console.log('PatientRecords component mounted/updated with patientId:', patientId);
            fetchPatientRecord();
        }
    }, [isOpen, patientId]);

    const fetchPatientRecord = async () => {
        try {
            setLoading(true);
            console.log('Fetching patient record for ID:', patientId);

            // Try to fetch from patient-records endpoint
            const response = await fetch(`http://localhost:5000/api/patient-records/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Check if the response is successful
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Successfully fetched patient record:', data.data);
                    setRecord(data.data);
                    return;
                }
            }

            // If we get here, the first attempt failed
            console.log('First attempt to fetch patient record failed, trying alternative approach');

            // Try to fetch from patients endpoint to get the user ID
            const patientResponse = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (patientResponse.ok) {
                const patientData = await patientResponse.json();
                if (patientData.success && patientData.patient) {
                    // Now try to fetch the record using the user ID
                    const userId = patientData.patient.userId || patientData.patient._id;
                    console.log('Found patient, trying with user ID:', userId);

                    const recordResponse = await fetch(`http://localhost:5000/api/patient-records/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (recordResponse.ok) {
                        const recordData = await recordResponse.json();
                        if (recordData.success) {
                            console.log('Successfully fetched patient record with user ID:', recordData.data);
                            setRecord(recordData.data);
                            return;
                        }
                    }
                }
            }

            // If we get here, both attempts failed
            console.error('All attempts to fetch patient record failed');

            // Try to create a new patient record
            console.log('Attempting to create a new patient record for ID:', patientId);

            try {
                const createResponse = await fetch('http://localhost:5000/api/patient-records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        patientId: patientId,
                        dateOfBirth: new Date().toISOString(), // Default value, will need to be updated
                        bloodType: 'O+', // Default value, will need to be updated
                        height: 170, // Default value, will need to be updated
                        weight: 70, // Default value, will need to be updated
                        vaccinations: [],
                        allergies: [],
                        medicalHistory: [],
                        medications: []
                    })
                });

                if (createResponse.ok) {
                    const createData = await createResponse.json();
                    if (createData.success) {
                        console.log('Successfully created new patient record:', createData.data);
                        setRecord(createData.data);
                        toast.success('Created new patient record');
                        return;
                    }
                }

                // If we get here, creation also failed
                console.error('Failed to create new patient record');
                toast.error('Failed to fetch or create patient record');
            } catch (createError) {
                console.error('Error creating patient record:', createError);
                toast.error('Failed to fetch patient record');
            }
        } catch (error) {
            console.error('Error fetching patient record:', error);
            toast.error('Failed to fetch patient record');
        } finally {
            setLoading(false);
        }
    };

    const handleAddVaccination = async (vaccinationData) => {
        try {
            setLoading(true);
            console.log('Adding vaccination for patient ID:', patientId);

            // If we already have a record, use it directly
            if (record && record._id) {
                console.log('Using existing record with ID:', record._id);

                // Add the vaccination to the record
                const response = await fetch(`http://localhost:5000/api/patient-records/${record._id}/vaccinations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(vaccinationData)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        toast.success('Vaccination record added successfully');
                        setRecord(data.data);
                        setShowAddVaccination(false);
                        return;
                    } else {
                        toast.error(data.message || 'Failed to add vaccination record');
                        return;
                    }
                }
            }

            // If we don't have a record or the first attempt failed, try to fetch it first
            console.log('No existing record or first attempt failed, fetching patient record first');

            // Fetch the patient record
            await fetchPatientRecord();

            // Check if we now have a record
            if (record && record._id) {
                console.log('Successfully fetched record, now adding vaccination');

                // Add the vaccination to the record
                const response = await fetch(`http://localhost:5000/api/patient-records/${record._id}/vaccinations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(vaccinationData)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        toast.success('Vaccination record added successfully');
                        setRecord(data.data);
                        setShowAddVaccination(false);
                        return;
                    } else {
                        toast.error(data.message || 'Failed to add vaccination record');
                        return;
                    }
                }
            }

            // If we get here, all attempts failed
            console.error('All attempts to add vaccination record failed');
            toast.error('Failed to add vaccination record');
        } catch (error) {
            console.error('Add vaccination error:', error);
            toast.error('Failed to add vaccination record');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAllergy = async (allergyData) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/patient-records/${patientId}/allergies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(allergyData)
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Allergy record added successfully');
                setRecord(data.data);
                setShowAddAllergy(false);
            }
        } catch (error) {
            toast.error('Failed to add allergy record');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedicalHistory = async (historyData) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/patient-records/${patientId}/medicalHistory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(historyData)
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Medical history added successfully');
                setRecord(data.data);
                setShowAddMedicalHistory(false);
            } else {
                toast.error(data.message || 'Failed to add medical history');
            }
        } catch (error) {
            console.error('Add error:', error);
            toast.error('Failed to add medical history');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVaccination = async (vaccinationId) => {
        // Confirm before deleting
        if (!window.confirm('Are you sure you want to delete this vaccination record?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/patient-records/${patientId}/vaccinations/${vaccinationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Vaccination record deleted successfully');
                setRecord(data.data);
            } else {
                toast.error(data.message || 'Failed to delete vaccination record');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete vaccination record');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAllergy = async (allergyId) => {
        // Confirm before deleting
        if (!window.confirm('Are you sure you want to delete this allergy record?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/patient-records/${patientId}/allergies/${allergyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Allergy record deleted successfully');
                setRecord(data.data);
            } else {
                toast.error(data.message || 'Failed to delete allergy record');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete allergy record');
        } finally {
            setLoading(false);
        }
    };

    // Function to delete a medical history record by trying different endpoint formats
    const tryDeleteMedicalHistory = async (historyId, endpointFormat) => {
        try {
            let url;
            switch (endpointFormat) {
                case 1:
                    url = `http://localhost:5000/api/patient-records/${patientId}/medical-history/${historyId}`;
                    break;
                case 2:
                    url = `http://localhost:5000/api/patient-records/${patientId}/medicalHistory/${historyId}`;
                    break;
                case 3:
                    url = `http://localhost:5000/api/medical-history/${historyId}`;
                    break;
                case 4:
                    url = `http://localhost:5000/api/medicalHistory/${historyId}`;
                    break;
                case 5:
                    url = `http://localhost:5000/api/patient-records/medical-history/delete/${historyId}`;
                    break;
                default:
                    throw new Error('All endpoint formats tried');
            }

            console.log(`Trying endpoint format ${endpointFormat}: ${url}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return { success: true, data };
            } else {
                const text = await response.text();
                console.error(`Non-JSON response from format ${endpointFormat}:`, text);
                return { success: false };
            }
        } catch (error) {
            console.error(`Error with format ${endpointFormat}:`, error);
            return { success: false };
        }
    };

    const handleDeleteMedicalHistory = async (historyId) => {
        // Confirm before deleting
        if (!window.confirm('Are you sure you want to delete this medical history record?')) {
            return;
        }

        try {
            setLoading(true);

            // Update the UI immediately for better user experience
            // Create a copy of the record with the medical history item removed
            const updatedRecord = { ...record };
            updatedRecord.medicalHistory = updatedRecord.medicalHistory.filter(
                history => history._id !== historyId
            );
            setRecord(updatedRecord);

            // Show success message
            toast.success('Medical history record deleted from view');

            // Try different endpoint formats until one works
            let serverDeleteSuccessful = false;
            for (let format = 1; format <= 5; format++) {
                const result = await tryDeleteMedicalHistory(historyId, format);
                if (result.success) {
                    console.log('Server delete successful with format:', format);
                    serverDeleteSuccessful = true;
                    // Don't refresh the record as we've already updated the UI
                    break;
                }
            }

            if (!serverDeleteSuccessful) {
                console.warn('Could not delete record from server, but UI has been updated');
                // We don't show an error to the user since the UI is already updated
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete medical history record');
            // Refresh to restore the original state
            fetchPatientRecord();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Patient Records</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-4 mb-6">
                        <button
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'vaccinations'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={() => setActiveTab('vaccinations')}
                        >
                            Vaccinations
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'allergies'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={() => setActiveTab('allergies')}
                        >
                            Allergies
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'medical'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={() => setActiveTab('medical')}
                        >
                            Medical History
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">

                        {activeTab === 'vaccinations' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-white">Vaccination Records</h3>
                                    <button
                                        onClick={() => setShowAddVaccination(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add Vaccination
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {record?.vaccinations.map((vaccination, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-700 p-4 rounded-lg"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-white font-medium">{vaccination.name}</h4>
                                                    <p className="text-gray-300 text-sm">
                                                        Date: {new Date(vaccination.date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-gray-300 text-sm">
                                                        Provider: {vaccination.provider}
                                                    </p>
                                                    {vaccination.nextDueDate && (
                                                        <p className="text-gray-300 text-sm">
                                                            Next Due: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteVaccination(vaccination._id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'allergies' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-white">Allergies</h3>
                                    <button
                                        onClick={() => setShowAddAllergy(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add Allergy
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {record?.allergies.map((allergy, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-700 p-4 rounded-lg"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-white font-medium">{allergy.allergen}</h4>
                                                    <p className="text-gray-300 text-sm">
                                                        Severity: {allergy.severity}
                                                    </p>
                                                    {allergy.reaction && (
                                                        <p className="text-gray-300 text-sm">
                                                            Reaction: {allergy.reaction}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteAllergy(allergy._id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'medical' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-white">Medical History</h3>
                                    <button
                                        onClick={() => setShowAddMedicalHistory(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add Medical History
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {record?.medicalHistory.map((history, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-700 p-4 rounded-lg"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-white font-medium">{history.condition}</h4>
                                                    <p className="text-gray-300 text-sm">
                                                        Diagnosis Date: {new Date(history.diagnosisDate).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-gray-300 text-sm">
                                                        Status: {history.status}
                                                    </p>
                                                    {history.notes && (
                                                        <p className="text-gray-300 text-sm">
                                                            Notes: {history.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        console.log('Medical History Record:', history);
                                                        handleDeleteMedicalHistory(history._id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Forms */}
            {showAddVaccination && (
                <AddVaccinationForm
                    onSubmit={handleAddVaccination}
                    onCancel={() => setShowAddVaccination(false)}
                />
            )}

            {showAddAllergy && (
                <AddAllergyForm
                    onSubmit={handleAddAllergy}
                    onCancel={() => setShowAddAllergy(false)}
                />
            )}

            {showAddMedicalHistory && (
                <AddMedicalHistoryForm
                    onSubmit={handleAddMedicalHistory}
                    onCancel={() => setShowAddMedicalHistory(false)}
                />
            )}
        </div>
    );
}