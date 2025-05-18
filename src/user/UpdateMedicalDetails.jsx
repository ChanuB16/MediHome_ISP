import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import UserProfile from "../components/UserProfile";

export default function UpdateMedicalDetails() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        medicalHistory: "",
        allergies: "",
        vaccinations: "",
        currentMedications: "",
        chronicConditions: ""
    });

    useEffect(() => {
        fetchMedicalDetails();
    }, []);

    const fetchMedicalDetails = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData._id) {
                toast.error("Please log in to view medical details");
                navigate("/login");
                return;
            }

            const response = await fetch(`http://localhost:5000/api/patients/${userData._id}/medical-details`);
            const data = await response.json();
            
            if (data.success) {
                setFormData(data.medicalDetails);
            }
        } catch (error) {
            console.error('Error fetching medical details:', error);
            toast.error('Failed to load medical details');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData._id) {
                toast.error("Please log in to update medical details");
                return;
            }

            console.log('Creating new medical record for patient:', userData._id);
            console.log('Form data:', formData);

            const response = await fetch(`http://localhost:5000/api/patient-records/${userData._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create medical record');
            }

            toast.success("Medical details added successfully");
            navigate("/udash");
        } catch (error) {
            console.error('Error creating medical record:', error);
            toast.error(error.message || "Failed to create medical record");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden opacity-30">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[120px]"></div>
            </div>

            <div className="flex flex-1 z-10">
                {/* Sticky Sidebar */}
                <aside className="w-72 bg-gray-800/80 backdrop-blur-lg p-6 text-white border-r border-gray-700 fixed h-full">
                    <UserProfile />

                    {/* Back Button */}
                    <button 
                        onClick={() => navigate("/udash")}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mt-4"
                    >
                        <FiArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-gray-900/50 backdrop-blur-sm ml-72 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-8">Update Medical Details</h1>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Medical History */}
                            <div>
                                <label className="block text-gray-300 mb-2">Medical History</label>
                                <textarea
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your medical history..."
                                />
                            </div>

                            {/* Allergies */}
                            <div>
                                <label className="block text-gray-300 mb-2">Allergies</label>
                                <textarea
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="List any allergies you have..."
                                />
                            </div>

                            {/* Vaccinations */}
                            <div>
                                <label className="block text-gray-300 mb-2">Vaccinations</label>
                                <textarea
                                    name="vaccinations"
                                    value={formData.vaccinations}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="List your vaccinations..."
                                />
                            </div>

                            {/* Current Medications */}
                            <div>
                                <label className="block text-gray-300 mb-2">Current Medications</label>
                                <textarea
                                    name="currentMedications"
                                    value={formData.currentMedications}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="List your current medications..."
                                />
                            </div>

                            {/* Chronic Conditions */}
                            <div>
                                <label className="block text-gray-300 mb-2">Chronic Conditions</label>
                                <textarea
                                    name="chronicConditions"
                                    value={formData.chronicConditions}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="List any chronic conditions..."
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
} 