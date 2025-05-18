import React, { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

export default function AddMedicalHistoryForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        condition: '',
        diagnosisDate: '',
        status: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        // Validate diagnosis date (no future dates)
        if (formData.diagnosisDate) {
            const selectedDate = new Date(formData.diagnosisDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

            if (selectedDate > today) {
                newErrors.diagnosisDate = "Diagnosis date cannot be in the future";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Add Medical History</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Condition
                        </label>
                        <input
                            type="text"
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Diagnosis Date
                        </label>
                        <input
                            type="date"
                            value={formData.diagnosisDate}
                            onChange={(e) => {
                                // Prevent future dates
                                const selectedDate = new Date(e.target.value);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

                                if (selectedDate > today) {
                                    setErrors({
                                        ...errors,
                                        diagnosisDate: "Diagnosis date cannot be in the future"
                                    });
                                } else {
                                    // Clear error if valid
                                    if (errors.diagnosisDate) {
                                        setErrors({
                                            ...errors,
                                            diagnosisDate: undefined
                                        });
                                    }
                                    setFormData({ ...formData, diagnosisDate: e.target.value });
                                }
                            }}
                            className={`w-full px-4 py-2 bg-gray-700 border ${errors.diagnosisDate ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white`}
                            max={new Date().toISOString().split('T')[0]} // Set max date to today
                            required
                        />
                        {errors.diagnosisDate && (
                            <div className="mt-1 flex items-center text-red-500 text-sm">
                                <FiAlertCircle className="mr-1" />
                                <span>{errors.diagnosisDate}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            required
                        >
                            <option value="">Select Status</option>
                            <option value="Active">Active</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Chronic">Chronic</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            rows="3"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Record
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}