import React, { useState } from 'react';

export default function AddAllergyForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        allergen: '',
        severity: '',
        reaction: '',
        notes: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Add Allergy Record</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Allergen
                        </label>
                        <input
                            type="text"
                            value={formData.allergen}
                            onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Severity
                        </label>
                        <select
                            value={formData.severity}
                            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            required
                        >
                            <option value="">Select Severity</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Reaction
                        </label>
                        <input
                            type="text"
                            value={formData.reaction}
                            onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
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