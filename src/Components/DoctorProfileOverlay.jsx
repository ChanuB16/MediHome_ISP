import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Lottie from 'lottie-react';
import doctorAnimation from '../assets/doctor-animation.json';
import { format, startOfWeek, addDays } from 'date-fns';

// List of medical specializations for the dropdown
const SPECIALIZATIONS = [
    "Allergy and Immunology",
    "Anesthesiology",
    "Cardiology",
    "Dermatology",
    "Emergency Medicine",
    "Endocrinology",
    "Family Medicine",
    "Gastroenterology",
    "General Surgery",
    "Geriatric Medicine",
    "Hematology",
    "Infectious Disease",
    "Internal Medicine",
    "Nephrology",
    "Neurology",
    "Neurosurgery",
    "Obstetrics and Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedic Surgery",
    "Otolaryngology (ENT)",
    "Pathology",
    "Pediatrics",
    "Physical Medicine and Rehabilitation",
    "Plastic Surgery",
    "Psychiatry",
    "Pulmonology",
    "Radiology",
    "Rheumatology",
    "Sports Medicine",
    "Urology",
    "Vascular Surgery"
];

// Function to generate dates for the current week
const generateCurrentWeekDates = () => {
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday

    return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(startDate, i);
        return {
            date: date,
            formattedDate: format(date, 'yyyy-MM-dd'),
            displayDate: format(date, 'EEE, MMM d'), // e.g., "Mon, Jan 1"
            dayName: format(date, 'EEEE') // e.g., "Monday"
        };
    });
};

const DoctorProfileOverlay = ({ isOpen, onClose, userId, existingData = null }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [lottieRef, setLottieRef] = useState(null);
    const [weekDates, setWeekDates] = useState(generateCurrentWeekDates());

    // Debug user ID
    useEffect(() => {
        console.log("DoctorProfileOverlay received userId:", userId);
        if (!userId) {
            console.error("No userId provided to DoctorProfileOverlay");
        }
    }, [userId]);

    // Update week dates when component mounts
    useEffect(() => {
        const currentWeekDates = generateCurrentWeekDates();
        setWeekDates(currentWeekDates);

        // If no existing data, update the form with the new dates
        if (!existingData) {
            setFormData(prev => ({
                ...prev,
                availability: currentWeekDates.map(dateInfo => ({
                    date: dateInfo.formattedDate,
                    displayDate: dateInfo.displayDate,
                    dayName: dateInfo.dayName,
                    slots: dateInfo.dayName === 'Saturday'
                        ? [{ startTime: '08:00', endTime: '13:00' }]
                        : dateInfo.dayName === 'Sunday'
                            ? []
                            : [{ startTime: '08:00', endTime: '17:00' }]
                }))
            }));
        }
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        hospital: '',
        location: '',
        experience: '',
        consultationFee: '',
        availability: weekDates.map(dateInfo => ({
            date: dateInfo.formattedDate,
            displayDate: dateInfo.displayDate,
            dayName: dateInfo.dayName,
            slots: dateInfo.dayName === 'Saturday'
                ? [{ startTime: '08:00', endTime: '13:00' }]
                : dateInfo.dayName === 'Sunday'
                    ? []
                    : [{ startTime: '08:00', endTime: '17:00' }]
        })),
        bio: '',
        education: [{ degree: '', institution: '', year: '' }],
        certifications: [{ name: '', issuer: '', year: '' }],
        languages: ['Sinhala', 'English'],
        image: '',
        imageUrl: ''
    });

    // No longer need selectedImage and imagePreview states

    // Error state
    const [errors, setErrors] = useState({});

    // Load existing data if available
    useEffect(() => {
        if (existingData) {
            // Determine if image is a URL or a file path
            const isImageUrl = existingData.image && existingData.image.startsWith('http');

            // Ensure image path is properly formatted for file paths
            const imagePath = !isImageUrl && existingData.image
                ? (existingData.image.startsWith('/')
                    ? existingData.image
                    : `/${existingData.image}`)
                : '';

            setFormData({
                name: existingData.name || '',
                specialization: existingData.specialization || '',
                hospital: existingData.hospital || '',
                location: existingData.location || '',
                experience: existingData.experience?.toString() || '',
                consultationFee: existingData.consultationFee?.toString() || '',
                availability: existingData.availability?.length > 0
                    ? existingData.availability.map((day, index) => {
                        // If the existing data has the old format (with 'day' property)
                        if (day.day && !day.date) {
                            return {
                                date: weekDates[index].formattedDate,
                                displayDate: weekDates[index].displayDate,
                                dayName: weekDates[index].dayName,
                                slots: day.slots || []
                            };
                        }
                        // If the existing data already has the new format
                        return day;
                    })
                    : weekDates.map(dateInfo => ({
                        date: dateInfo.formattedDate,
                        displayDate: dateInfo.displayDate,
                        dayName: dateInfo.dayName,
                        slots: dateInfo.dayName === 'Saturday'
                            ? [{ startTime: '08:00', endTime: '13:00' }]
                            : dateInfo.dayName === 'Sunday'
                                ? []
                                : [{ startTime: '08:00', endTime: '17:00' }]
                    })),
                bio: existingData.bio || '',
                education: existingData.education?.length > 0
                    ? existingData.education
                    : [{ degree: '', institution: '', year: '' }],
                certifications: existingData.certifications?.length > 0
                    ? existingData.certifications
                    : [{ name: '', issuer: '', year: '' }],
                languages: existingData.languages?.length > 0
                    ? existingData.languages
                    : ['Sinhala', 'English'],
                image: isImageUrl ? '' : imagePath,
                imageUrl: isImageUrl ? existingData.image : ''
            });
        }
    }, [existingData]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle availability changes
    const handleAvailabilityChange = (dayIndex, slotIndex, field, value) => {
        setFormData(prev => {
            const newAvailability = [...prev.availability];
            newAvailability[dayIndex].slots[slotIndex][field] = value;
            return {
                ...prev,
                availability: newAvailability
            };
        });
    };

    // Add availability slot
    const addAvailabilitySlot = (dayIndex) => {
        setFormData(prev => {
            const newAvailability = [...prev.availability];
            // Use appropriate default times based on the day
            const dayName = prev.availability[dayIndex].dayName;
            if (dayName === 'Saturday') {
                newAvailability[dayIndex].slots.push({ startTime: '08:00', endTime: '13:00' });
            } else {
                newAvailability[dayIndex].slots.push({ startTime: '08:00', endTime: '17:00' });
            }
            return {
                ...prev,
                availability: newAvailability
            };
        });
    };

    // Remove availability slot
    const removeAvailabilitySlot = (dayIndex, slotIndex) => {
        setFormData(prev => {
            const newAvailability = [...prev.availability];
            newAvailability[dayIndex].slots.splice(slotIndex, 1);
            return {
                ...prev,
                availability: newAvailability
            };
        });
    };

    // Handle education changes
    const handleEducationChange = (index, field, value) => {
        setFormData(prev => {
            const newEducation = [...prev.education];
            newEducation[index][field] = value;
            return {
                ...prev,
                education: newEducation
            };
        });
    };

    // Add education field
    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [...prev.education, { degree: '', institution: '', year: '' }]
        }));
    };

    // Remove education field
    const removeEducation = (index) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // Handle certification changes
    const handleCertificationChange = (index, field, value) => {
        setFormData(prev => {
            const newCertifications = [...prev.certifications];
            newCertifications[index][field] = value;
            return {
                ...prev,
                certifications: newCertifications
            };
        });
    };

    // Add certification field
    const addCertification = () => {
        setFormData(prev => ({
            ...prev,
            certifications: [...prev.certifications, { name: '', issuer: '', year: '' }]
        }));
    };

    // Remove certification field
    const removeCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    // Handle language changes
    const handleLanguageChange = (index, value) => {
        const newLanguages = [...formData.languages];
        newLanguages[index] = value;

        setFormData(prev => ({
            ...prev,
            languages: newLanguages
        }));
    };

    // Add language field
    const addLanguage = () => {
        setFormData(prev => ({
            ...prev,
            languages: [...prev.languages, '']
        }));
    };

    // Remove language field
    const removeLanguage = (index) => {
        const newLanguages = [...formData.languages];
        newLanguages.splice(index, 1);

        setFormData(prev => ({
            ...prev,
            languages: newLanguages
        }));
    };

    // No longer need handleImageChange function

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
        if (!formData.hospital.trim()) newErrors.hospital = 'Hospital is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.experience) newErrors.experience = 'Experience is required';
        if (isNaN(formData.experience) || parseInt(formData.experience) <= 0) newErrors.experience = 'Experience must be a positive number';
        if (!formData.consultationFee) newErrors.consultationFee = 'Consultation fee is required';
        if (isNaN(formData.consultationFee) || parseInt(formData.consultationFee) <= 0) newErrors.consultationFee = 'Consultation fee must be a positive number';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            console.log("Submitting with userId:", userId);

            if (!userId) {
                toast.error("User ID is missing. Please log in again.");
                setIsLoading(false);
                return;
            }

            // Use the existing image path if no URL is provided
            let imagePath = formData.image;

            // If image URL is provided, use that
            if (formData.imageUrl && formData.imageUrl.trim() !== '') {
                imagePath = formData.imageUrl.trim();
            }

            const dataToSubmit = {
                ...formData,
                experience: parseInt(formData.experience),
                consultationFee: parseInt(formData.consultationFee),
                userId: userId,
                image: imagePath,
                // Remove imageUrl from the data to submit as it's not needed in the database
                imageUrl: undefined
            };

            // Remove empty education entries
            dataToSubmit.education = dataToSubmit.education.filter(edu =>
                edu.degree.trim() || edu.institution.trim() || edu.year
            );

            // Remove empty certification entries
            dataToSubmit.certifications = dataToSubmit.certifications.filter(cert =>
                cert.name.trim() || cert.issuer.trim() || cert.year
            );

            // Remove empty language entries
            dataToSubmit.languages = dataToSubmit.languages.filter(lang => lang.trim());

            const url = existingData
                ? `http://localhost:5000/api/doctors/${existingData._id}`
                : 'http://localhost:5000/api/doctors/create';

            const method = existingData ? 'PUT' : 'POST';

            console.log("Submitting to URL:", url);
            console.log("With data:", dataToSubmit);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit)
            });

            const data = await response.json();
            console.log("Response:", data);

            if (data.success) {
                toast.success(existingData ? 'Profile updated successfully!' : 'Profile created successfully!');

                // Update the user data in localStorage with the new image
                try {
                    const userData = JSON.parse(localStorage.getItem('user'));
                    if (userData) {
                        // Fetch the updated doctor profile to get the latest data
                        const doctorResponse = await fetch(`http://localhost:5000/api/doctors/user/${userData._id}`);
                        const doctorData = await doctorResponse.json();

                        if (doctorData.success && doctorData.data) {
                            // Update the user data with the new image
                            userData.image = doctorData.data.image;
                            localStorage.setItem('user', JSON.stringify(userData));
                        }
                    }
                } catch (error) {
                    console.error('Error updating user data in localStorage:', error);
                }

                onClose();
                window.location.reload();
            } else {
                toast.error(data.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error saving doctor profile:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        try {
            if (!userId) {
                toast.error("User ID is missing. Please log in again.");
                setIsLoading(false);
                return;
            }

            const response = await fetch(`http://localhost:5000/api/doctors/${existingData._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Profile deleted successfully!');
                localStorage.removeItem('user');
                onClose();
                navigate('/login');
            } else {
                toast.error(data.error || 'Failed to delete profile');
            }
        } catch (error) {
            console.error('Error deleting doctor profile:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Toaster position="top-center" />

            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {existingData ? 'Update Doctor Profile' : 'Complete Your Doctor Profile'}
                        </h2>
                        <div className="flex items-center space-x-4">
                            {existingData && (
                                <button
                                    onClick={handleDeleteProfile}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete Profile</span>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Lottie Animation */}
                        <div className="w-full md:w-1/3 flex justify-center">
                            <div className="w-full max-w-xs">
                                <Lottie
                                    lottieRef={setLottieRef}
                                    animationData={doctorAnimation}
                                    loop={true}
                                    autoplay={true}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        {/* Form */}
                        <div className="w-full md:w-2/3">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            placeholder="Dr. John Doe"
                                        />
                                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Specialization
                                        </label>
                                        <select
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.specialization ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                        >
                                            <option value="">Select a specialization</option>
                                            {SPECIALIZATIONS.map((specialization, index) => (
                                                <option key={index} value={specialization}>
                                                    {specialization}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Hospital
                                        </label>
                                        <input
                                            type="text"
                                            name="hospital"
                                            value={formData.hospital}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.hospital ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            placeholder="Asiri Hospital"
                                        />
                                        {errors.hospital && <p className="mt-1 text-xs text-red-500">{errors.hospital}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.location ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            placeholder="Colombo"
                                        />
                                        {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Years of Experience
                                        </label>
                                        <input
                                            type="number"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.experience ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            placeholder="10"
                                            min="0"
                                        />
                                        {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Consultation Fee (LKR)
                                        </label>
                                        <input
                                            type="number"
                                            name="consultationFee"
                                            value={formData.consultationFee}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.consultationFee ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            placeholder="3500"
                                            min="0"
                                        />
                                        {errors.consultationFee && <p className="mt-1 text-xs text-red-500">{errors.consultationFee}</p>}
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Bio
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Tell us about yourself and your expertise..."
                                        rows="3"
                                    />
                                </div>

                                {/* Availability */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Availability
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentWeekDates = generateCurrentWeekDates();
                                                setWeekDates(currentWeekDates);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    availability: currentWeekDates.map(dateInfo => {
                                                        // Try to find existing slots for this day of the week
                                                        const existingDay = prev.availability.find(
                                                            day => day.dayName === dateInfo.dayName
                                                        );

                                                        return {
                                                            date: dateInfo.formattedDate,
                                                            displayDate: dateInfo.displayDate,
                                                            dayName: dateInfo.dayName,
                                                            slots: existingDay?.slots || (
                                                                dateInfo.dayName === 'Saturday'
                                                                    ? [{ startTime: '09:00', endTime: '13:00' }]
                                                                    : dateInfo.dayName === 'Sunday'
                                                                        ? []
                                                                        : [{ startTime: '09:00', endTime: '17:00' }]
                                                            )
                                                        };
                                                    })
                                                }));
                                            }}
                                            className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded"
                                        >
                                            Update to Current Week
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.availability.map((day, dayIndex) => (
                                            <div key={dayIndex} className="bg-gray-700 p-3 rounded-lg">
                                                <div className="font-medium text-white mb-2">
                                                    <span className="text-blue-300">{day.displayDate}</span>
                                                    <span className="text-gray-400 text-sm ml-2">({day.dayName})</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {day.slots.map((slot, slotIndex) => (
                                                        <div key={slotIndex} className="flex items-center space-x-2">
                                                            <input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) => handleAvailabilityChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                                                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                            <span className="text-gray-300">to</span>
                                                            <input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) => handleAvailabilityChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                                                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                            {slotIndex > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAvailabilitySlot(dayIndex, slotIndex)}
                                                                    className="text-red-400 hover:text-red-300"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addAvailabilitySlot(dayIndex)}
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        + Add Time Slot
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Education
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addEducation}
                                            className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded"
                                        >
                                            Add Education
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.education.map((edu, index) => (
                                            <div key={index} className="bg-gray-700 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="font-medium text-white">Education #{index + 1}</div>
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEducation(index)}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={edu.degree}
                                                            onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Degree"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={edu.institution}
                                                            onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Institution"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={edu.year}
                                                            onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Year"
                                                            min="1900"
                                                            max="2100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Certifications */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Certifications
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addCertification}
                                            className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded"
                                        >
                                            Add Certification
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.certifications.map((cert, index) => (
                                            <div key={index} className="bg-gray-700 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="font-medium text-white">Certification #{index + 1}</div>
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCertification(index)}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={cert.name}
                                                            onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Certification Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={cert.issuer}
                                                            onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Issuing Organization"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={cert.year}
                                                            onChange={(e) => handleCertificationChange(index, 'year', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Year"
                                                            min="1900"
                                                            max="2100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Languages */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Languages
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addLanguage}
                                            className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded"
                                        >
                                            Add Language
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.languages.map((lang, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={lang}
                                                    onChange={(e) => handleLanguageChange(index, e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    placeholder="Language"
                                                />
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLanguage(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Profile Image URL */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Profile Image URL
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-700">
                                            {(formData.image || formData.imageUrl) && (
                                                <img
                                                    src={
                                                        formData.imageUrl ? formData.imageUrl :
                                                        (formData.image && formData.image.startsWith('http') ? formData.image :
                                                            (formData.image ? `http://localhost:5000${formData.image}` : 'https://s3.amazonaws.com/images/doctor.png'))
                                                    }
                                                    alt="Profile Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://s3.amazonaws.com/images/doctor.png'; // Default image on error
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                name="imageUrl"
                                                value={formData.imageUrl || ''}
                                                onChange={(e) => {
                                                    const url = e.target.value;
                                                    setFormData({...formData, imageUrl: url});
                                                }}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="Enter image URL"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Enter a direct URL to an image (e.g., https://example.com/image.jpg)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all flex items-center justify-center shadow-lg hover:shadow-cyan-500/20"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {existingData ? 'Updating Profile...' : 'Creating Profile...'}
                                            </>
                                        ) : (
                                            existingData ? 'Update Profile' : 'Create Profile'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfileOverlay;