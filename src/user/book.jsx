import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiClock, FiUser, FiMapPin, FiDollarSign } from "react-icons/fi";
import { Toaster } from "react-hot-toast";
import UserProfile from "../components/UserProfile";
import { toast } from "react-hot-toast";
import LocationPicker from "../Components/LocationPicker";

export default function BookAppointment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [availableTimes, setAvailableTimes] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        reason: "",
        location: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDoctorDetails();
        fetchUserDetails();
    }, [id]);

    // Fetch user details from localStorage
    const fetchUserDetails = () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) {
                // Pre-fill form with user data if available
                setFormData(prevData => ({
                    ...prevData,
                    name: userData.username || '',
                    email: userData.email || '',
                    phone: userData.phone || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const fetchDoctorDetails = async () => {
        try {
            console.log('Fetching doctor details for ID:', id);
            const response = await fetch(`http://localhost:5000/api/doctors/${id}`);

            if (!response.ok) {
                console.error('Failed to fetch doctor details. Status:', response.status);
                toast.error('Failed to fetch doctor details. Please try again.');
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            if (data.success) {
                console.log('Doctor details fetched successfully:', data.data);

                // Validate doctor data
                if (!data.data) {
                    console.error('Doctor data is null or undefined');
                    toast.error('Invalid doctor data received');
                    setIsLoading(false);
                    return;
                }

                // Check if availability data exists and is valid
                if (!data.data.availability || !Array.isArray(data.data.availability)) {
                    console.warn('Doctor has no availability data or it is invalid:', data.data.availability);
                    // Create a default availability structure with sample time slots if missing
                    const defaultSlots = [
                        { startTime: '09:00', endTime: '12:00' },
                        { startTime: '14:00', endTime: '17:00' }
                    ];

                    data.data.availability = [
                        { day: 'Monday', slots: [...defaultSlots] },
                        { day: 'Tuesday', slots: [...defaultSlots] },
                        { day: 'Wednesday', slots: [...defaultSlots] },
                        { day: 'Thursday', slots: [...defaultSlots] },
                        { day: 'Friday', slots: [...defaultSlots] },
                        { day: 'Saturday', slots: [{ startTime: '09:00', endTime: '13:00' }] },
                        { day: 'Sunday', slots: [] }
                    ];

                    console.log('Created default availability structure:', data.data.availability);
                }

                setDoctor(data.data);

                // Set default date to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                setSelectedDate(tomorrowStr);

                // Trigger date change handler to load available slots for tomorrow
                setTimeout(() => {
                    const dateEvent = {
                        target: { value: tomorrowStr }
                    };
                    handleDateChange(dateEvent);
                }, 100);

            } else {
                console.error('Failed to fetch doctor details:', data.error);
                toast.error(data.error || 'Failed to fetch doctor details');
            }
        } catch (error) {
            console.error('Error fetching doctor details:', error);
            toast.error('An error occurred while fetching doctor details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        setSelectedTime(""); // Reset selected time when date changes

        // Filter available times based on the selected date
        if (doctor && date) {
            try {
                // Make sure the date is valid
                const selectedDateObj = new Date(date);
                if (isNaN(selectedDateObj.getTime())) {
                    console.error('Invalid date selected:', date);
                    setAvailableTimes([]);
                    return;
                }

                const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
                console.log('Selected day of week:', dayOfWeek);

                // Check if doctor has availability data
                if (!doctor.availability || !Array.isArray(doctor.availability)) {
                    console.error('Doctor availability data is missing or invalid:', doctor.availability);
                    setAvailableTimes([]);
                    return;
                }

                // Log the availability data for debugging
                console.log('Doctor availability:', doctor.availability);

                // Find the availability for the selected day with proper null checks
                // First try exact match
                let availability = doctor.availability.find(a =>
                    a && a.day && typeof a.day === 'string' &&
                    a.day.toLowerCase() === dayOfWeek.toLowerCase()
                );

                // If no match found, try more flexible matching (first 3 chars)
                if (!availability) {
                    const shortDayName = dayOfWeek.substring(0, 3).toLowerCase();
                    availability = doctor.availability.find(a =>
                        a && a.day && typeof a.day === 'string' &&
                        a.day.toLowerCase().startsWith(shortDayName)
                    );

                    if (availability) {
                        console.log('Found availability using flexible matching:', availability);
                    }
                }

                // If still no match, create a default availability for this day
                if (!availability) {
                    console.log('No availability found for', dayOfWeek, 'creating default');

                    // Create default slots for this day
                    const defaultSlots = [
                        { startTime: '09:00', endTime: '12:00' },
                        { startTime: '14:00', endTime: '17:00' }
                    ];

                    // Don't add slots for Sunday
                    const isSunday = dayOfWeek.toLowerCase() === 'sunday';

                    availability = {
                        day: dayOfWeek,
                        slots: isSunday ? [] : defaultSlots
                    };

                    // Add this new availability to the doctor's availability array
                    doctor.availability.push(availability);
                    console.log('Added default availability for', dayOfWeek);
                }

                console.log('Found availability for day:', availability);

                if (availability && availability.slots && Array.isArray(availability.slots) && availability.slots.length > 0) {
                    // Generate time slots based on start and end times
                    const timeSlots = availability.slots.map(slot => {
                        if (!slot || !slot.startTime || !slot.endTime) {
                            console.warn('Invalid slot data:', slot);
                            return [];
                        }

                        try {
                            const start = new Date(`2000-01-01 ${slot.startTime}`);
                            const end = new Date(`2000-01-01 ${slot.endTime}`);

                            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                                console.warn('Invalid time format in slot:', slot);
                                return [];
                            }

                            const slots = [];

                            // Generate slots in 30-minute intervals
                            for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 30)) {
                                const timeString = time.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                });
                                slots.push(timeString);
                            }

                            return slots;
                        } catch (error) {
                            console.error('Error generating time slots:', error);
                            return [];
                        }
                    }).flat();

                    // Sort times in ascending order
                    const sortedTimes = [...new Set(timeSlots)].sort((a, b) => {
                        try {
                            const timeA = new Date(`2000-01-01 ${a}`);
                            const timeB = new Date(`2000-01-01 ${b}`);
                            return timeA - timeB;
                        } catch (error) {
                            console.error('Error sorting times:', error);
                            return 0;
                        }
                    });

                    console.log('Generated time slots:', sortedTimes);
                    setAvailableTimes(sortedTimes);
                } else {
                    console.log('No available slots found for the selected day');
                    setAvailableTimes([]);
                }
            } catch (error) {
                console.error('Error in handleDateChange:', error);
                setAvailableTimes([]);
            }
        } else {
            setAvailableTimes([]);
        }
    };

    const handleTimeChange = (e) => {
        setSelectedTime(e.target.value);
    };

    const validatePhonenumber = (phone) => {
        // Remove any spaces or special characters
        const cleanedPhone = phone.replace(/\D/g, '');

        // Check if it's a valid Sri Lankan mobile number
        // Format: 0XX-XXXXXXX or +94XX-XXXXXXX
        const mobileRegex = /^(0\d{9}|94\d{9}|\+94\d{9})$/;

        if (!mobileRegex.test(cleanedPhone)) {
            return "Please enter a valid Sri Lankan mobile number (e.g., 0771234567 or +94771234567)";
        }

        // Check if it starts with a valid mobile prefix
        const validPrefixes = ['70', '71', '72', '74', '75', '76', '77', '78'];
        const prefix = cleanedPhone.slice(-9, -7); // Get the first two digits after 0 or 94

        if (!validPrefixes.includes(prefix)) {
            return "Please enter a valid Sri Lankan mobile number prefix";
        }

        return "";
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Format phone number as user types
        if (name === 'phone') {
            // Remove all non-digit characters
            let cleaned = value.replace(/\D/g, '');

            // Format based on length
            if (cleaned.length > 0) {
                if (cleaned.startsWith('94')) {
                    cleaned = '+' + cleaned;
                } else if (cleaned.startsWith('0')) {
                    cleaned = cleaned;
                } else {
                    cleaned = '0' + cleaned;
                }
            }

            setFormData(prev => ({
                ...prev,
                [name]: cleaned
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate form data
            if (!formData.name || !formData.email || !formData.phone || !formData.reason || !formData.location) {
                toast.error("Please fill in all required fields");
                return;
            }

            // Validate phone number
            const phoneError = validatePhonenumber(formData.phone);
            if (phoneError) {
                toast.error(phoneError);
                return;
            }

            if (!selectedDate || !selectedTime) {
                toast.error("Please select both date and time");
                return;
            }

            // Store appointment data in session storage
            const appointmentData = {
                doctorDetails: {
                    _id: id,
                    name: doctor.name,
                    specialty: doctor.specialization,
                    fee: doctor.consultationFee,
                    date: selectedDate,
                    time: selectedTime,
                    reason: formData.reason
                },
                patientDetails: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    location: formData.location
                }
            };

            sessionStorage.setItem('pendingAppointment', JSON.stringify(appointmentData));

            // Navigate to payment page
            navigate('/pay');
        } catch (error) {
            console.error('Error submitting appointment:', error);
            toast.error("Failed to submit appointment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading doctor details...</div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Doctor not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden opacity-30">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[120px]"></div>
            </div>

            <div className="flex flex-1 z-10">
                {/* Sticky Sidebar */}
                <aside className="w-72 bg-gray-800/80 backdrop-blur-lg p-6 text-white border-r border-gray-700 fixed h-full">
                    {/* User Profile */}
                    <UserProfile />

                    {/* Back Button */}
                    <button
                        onClick={() => navigate("/doc")}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mt-4"
                    >
                        <FiArrowLeft />
                        <span>Back to Doctors</span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-gray-900/50 backdrop-blur-sm ml-72 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-8">Book Appointment</h1>

                        {/* Doctor Info Card */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                            <div className="flex items-start">
                                {doctor.image ? (
                                    <img
                                        src={doctor.image.startsWith('http') ? doctor.image : `http://localhost:5000${doctor.image}`}
                                        alt={doctor.name}
                                        className="w-24 h-24 rounded-full border-2 border-blue-400/50 mr-6 object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://s3.amazonaws.com/images/doctor.png'; // Default image on error
                                        }}
                                    />
                                ) : (
                                    <img
                                        src="https://s3.amazonaws.com/images/doctor.png"
                                        alt={doctor.name}
                                        className="w-24 h-24 rounded-full border-2 border-blue-400/50 mr-6 object-cover"
                                    />
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold text-blue-300">{doctor.name}</h2>
                                    <p className="text-gray-300 mb-2">{doctor.specialization}</p>
                                    <div className="flex items-center text-gray-400 mb-1">
                                        <FiMapPin className="mr-2" />
                                        <span>{doctor.hospital}</span>
                                    </div>
                                    <div className="flex items-center text-gray-400">
                                        <FiDollarSign className="mr-2" />
                                        <span>Consultation Fee: LKR {doctor.consultationFee.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking Form */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6">Select Date & Time</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-gray-400 mb-2">Date</label>
                                        <div className="relative">
                                            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={handleDateChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 mb-2">Time</label>
                                        <div className="relative">
                                            <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={selectedTime}
                                                onChange={handleTimeChange}
                                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                                required
                                                disabled={availableTimes.length === 0}
                                            >
                                                <option value="">Select a time slot</option>
                                                {availableTimes.map((time, idx) => (
                                                    <option key={idx} value={time} className="bg-gray-700 text-white">
                                                        {time}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {availableTimes.length === 0 && selectedDate && (
                                            <p className="text-red-400 text-sm mt-1">No available time slots for this date</p>
                                        )}
                                        {availableTimes.length > 0 && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                {availableTimes.length} time slot{availableTimes.length !== 1 ? 's' : ''} available
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">Your Information</h2>
                                    {(formData.name || formData.email || formData.phone) && (
                                        <div className="text-sm text-blue-400 bg-blue-900/20 px-3 py-1 rounded-lg">
                                            Your details have been auto-filled. You can edit if needed.
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-gray-400 mb-2">
                                            Name
                                            {formData.name && <span className="text-blue-400 text-xs ml-2">(Auto-filled)</span>}
                                        </label>
                                        <div className="relative">
                                            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 mb-2">
                                            Email
                                            {formData.email && <span className="text-blue-400 text-xs ml-2">(Auto-filled)</span>}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 mb-2">
                                            Phone
                                            {formData.phone && <span className="text-blue-400 text-xs ml-2">(Auto-filled)</span>}
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="0771234567 or +94771234567"
                                            maxLength={12}
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-400 mb-2">Reason for Visit</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">Location</label>
                                    <LocationPicker
                                        onLocationSelect={(address) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                location: address
                                            }));
                                        }}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}