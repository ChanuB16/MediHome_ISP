import React, { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

export default function AddVaccinationForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        provider: '',
        nextDueDate: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        // Validate date (no future dates)
        if (formData.date) {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

            if (selectedDate > today) {
                newErrors.date = "Vaccination date cannot be in the future";
            }
        }

        // Validate next due date (no past dates)
        if (formData.nextDueDate) {
            const selectedDate = new Date(formData.nextDueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

            if (selectedDate < today) {
                newErrors.nextDueDate = "Next due date cannot be in the past";
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
                <h3 className="text-xl font-bold text-white mb-4">Add Vaccination Record</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Vaccine Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Date Administered
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => {
                                // Prevent future dates
                                const selectedDate = new Date(e.target.value);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

                                if (selectedDate > today) {
                                    setErrors({
                                        ...errors,
                                        date: "Vaccination date cannot be in the future"
                                    });
                                } else {
                                    // Clear error if valid
                                    if (errors.date) {
                                        setErrors({
                                            ...errors,
                                            date: undefined
                                        });
                                    }
                                    setFormData({ ...formData, date: e.target.value });
                                }
                            }}
                            className={`w-full px-4 py-2 bg-gray-700 border ${errors.date ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white`}
                            max={new Date().toISOString().split('T')[0]} // Set max date to today
                            required
                        />
                        {errors.date && (
                            <div className="mt-1 flex items-center text-red-500 text-sm">
                                <FiAlertCircle className="mr-1" />
                                <span>{errors.date}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Provider
                        </label>
                        <input
                            type="text"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Next Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.nextDueDate}
                            onChange={(e) => {
                                // Prevent past dates
                                const selectedDate = new Date(e.target.value);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

                                if (selectedDate < today) {
                                    setErrors({
                                        ...errors,
                                        nextDueDate: "Next due date cannot be in the past"
                                    });
                                } else {
                                    // Clear error if valid
                                    if (errors.nextDueDate) {
                                        setErrors({
                                            ...errors,
                                            nextDueDate: undefined
                                        });
                                    }
                                    setFormData({ ...formData, nextDueDate: e.target.value });
                                }
                            }}
                            className={`w-full px-4 py-2 bg-gray-700 border ${errors.nextDueDate ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white`}
                            min={new Date().toISOString().split('T')[0]} // Set min date to today
                        />
                        {errors.nextDueDate && (
                            <div className="mt-1 flex items-center text-red-500 text-sm">
                                <FiAlertCircle className="mr-1" />
                                <span>{errors.nextDueDate}</span>
                            </div>
                        )}
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