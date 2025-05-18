import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Lottie from "lottie-react";
import signupAnimation from "../assets/signup-animation.json";
import { generateAvatar } from "../utils/avatarGenerator";

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

export default function SignUp() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        isDoctor: false,
        location: "",
        doctorReg: "",
        // Doctor specific fields
        name: "",
        specialization: "",
        hospital: "",
        consultationFee: "",
        // Patient specific fields
        phone: "",
        address: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [avatar, setAvatar] = useState({ initials: "", bgColor: "" });
    const navigate = useNavigate();
    const lottieRef = useRef();

    // Update avatar when name changes
    useEffect(() => {
        if (formData.name) {
            const newAvatar = generateAvatar(formData.name);
            setAvatar(newAvatar);
        }
    }, [formData.name]);

    const validateEmail = (email) => {
        // Basic email validation
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Check if email ends with .com and has no characters after it
        if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
            return false;
        }

        return re.test(email);
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        if (password.length < minLength) errors.push(`at least ${minLength} characters`);
        if (!hasUpperCase) errors.push("one uppercase letter");
        if (!hasLowerCase) errors.push("one lowercase letter");
        if (!hasNumbers) errors.push("one number");
        if (!hasSpecialChar) errors.push("one special character");

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };

    const validateUsername = (username) => {
        if (username.length < 2) return "Username must be at least 2 characters long";
        if (!/^[a-zA-Z\s]*$/.test(username)) return "Username can only contain letters and spaces (no numbers or symbols)";
        return "";
    };

    const validatePhonenumber = (phone) => {
        // Remove any spaces or special characters
        const cleanedPhone = phone.replace(/\D/g, '');

        // Check if it's exactly 10 digits (for Sri Lankan numbers)
        if (cleanedPhone.length !== 10) {
            return "Phone number must be exactly 10 digits";
        }

        // Check if it's a valid Sri Lankan mobile number
        // Format: 0XXXXXXXXX (10 digits)
        const mobileRegex = /^0\d{9}$/;

        if (!mobileRegex.test(cleanedPhone)) {
            return "Please enter a valid phone number starting with 0";
        }

        // Check if it starts with a valid mobile prefix
        const validPrefixes = ['07']; // All mobile numbers start with 07
        const prefix = cleanedPhone.substring(0, 2);

        if (!validPrefixes.includes(prefix)) {
            return "Please enter a valid mobile number starting with 07";
        }

        return "";
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Validate username as user types
        if (name === 'username') {
            // Only allow letters and spaces
            if (value !== '' && !/^[a-zA-Z\s]*$/.test(value)) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Username can only contain letters and spaces (no numbers or symbols)"
                }));
                return; // Don't update the form data if invalid
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));

                // Clear error if valid or empty
                if (errors[name]) {
                    setErrors(prev => ({
                        ...prev,
                        [name]: ""
                    }));
                }
            }
        }
        // Validate email as user types
        else if (name === 'email') {
            // Check if trying to type after .com
            if (formData.email.includes('.com') &&
                formData.email.indexOf('.com') === formData.email.length - 4 &&
                value.length > formData.email.length) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "No characters allowed after .com"
                }));
                return; // Don't update the form data if invalid
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));

                // Clear error if valid or empty
                if (errors[name]) {
                    setErrors(prev => ({
                        ...prev,
                        [name]: ""
                    }));
                }
            }
        }
        // Format phone number as user types
        else if (name === 'phone') {
            // Only allow digits and limit to 10 characters
            const cleaned = value.replace(/\D/g, '');

            // Enforce 10 digit limit
            if (cleaned.length > 10) {
                // Don't update if already at 10 digits
                setErrors(prev => ({
                    ...prev,
                    [name]: "Phone number cannot exceed 10 digits"
                }));
                return;
            }

            // Ensure it starts with 0
            let formattedPhone = cleaned;
            if (cleaned.length > 0 && !cleaned.startsWith('0')) {
                formattedPhone = '0' + cleaned;
                // If adding the 0 makes it exceed 10 digits, truncate
                if (formattedPhone.length > 10) {
                    formattedPhone = formattedPhone.substring(0, 10);
                }
            }

            setFormData(prev => ({
                ...prev,
                [name]: formattedPhone
            }));

            // Clear error if valid
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ""
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error when user starts typing (for fields other than username and email)
        if (name !== 'username' && name !== 'email' && errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Username validation
        const usernameError = validateUsername(formData.username);
        if (usernameError) newErrors.username = usernameError;

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(formData.email)) {
            if (formData.email.includes('.com') && formData.email.indexOf('.com') !== formData.email.length - 4) {
                newErrors.email = "No characters allowed after .com";
            } else {
                newErrors.email = "Please enter a valid email";
            }
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else {
            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                newErrors.password = `Password must contain ${passwordValidation.errors.join(", ")}`;
            }
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }

        // Doctor specific validations
        if (formData.isDoctor) {
            if (!formData.name) newErrors.name = "Name is required";
            if (!formData.specialization) newErrors.specialization = "Specialization is required";
            if (!formData.hospital) newErrors.hospital = "Hospital is required";
            if (!formData.consultationFee) newErrors.consultationFee = "Consultation fee is required";
            if (!formData.doctorReg) newErrors.doctorReg = "Doctor registration number is required";
        } else {
            // Patient specific validations
            if (!formData.phone) newErrors.phone = "Phone number is required";
            if (!formData.address) newErrors.address = "Address is required";
        }

        // Phone number validation
        if (!formData.isDoctor) {
            if (!formData.phone) {
                newErrors.phone = "Phone number is required";
            } else {
                const phoneError = validatePhonenumber(formData.phone);
                if (phoneError) {
                    newErrors.phone = phoneError;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        lottieRef.current?.play();

        try {
            const response = await fetch("http://localhost:5000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    isDoctor: formData.isDoctor,
                    ...(formData.isDoctor ? {
                        // Include all doctor-specific fields for profile creation
                        name: formData.name,
                        specialization: formData.specialization,
                        hospital: formData.hospital === "Other" ? formData.customHospital : formData.hospital,
                        consultationFee: parseFloat(formData.consultationFee),
                        doctorReg: formData.doctorReg,
                        location: formData.location || ""
                    } : {
                        phone: formData.phone,
                        address: formData.address,
                        location: formData.address
                    })
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(data.message || "Account created successfully!");
                setTimeout(() => navigate("/login"), 1500);
            } else {
                toast.error(data.error || "Registration failed");
            }
        } catch (e) {
            console.error("Registration error:", e);
            toast.error(e.message === "Failed to fetch"
                ? "Network error. Please check your connection"
                : "Server error. Please try again");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500 rounded-full blur-[120px]"></div>
            </div>

            <Toaster position="top-center" />

            {/* Main Container */}
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 z-10">
                {/* Lottie Animation - Side */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex justify-center">
                    <div className="w-full max-w-md">
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={signupAnimation}
                            loop={true}
                            autoplay={true}
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Sign Up Form */}
                <div className="w-full md:w-1/2 lg:w-2/5 max-w-md bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {formData.isDoctor ? "Create Doctor Account" : "Create Patient Account"}
                        </h2>
                        <p className="text-gray-300">Join our platform today</p>
                    </div>

                    {/* Avatar Preview */}
                    {formData.name && (
                        <div className="flex justify-center mb-6">
                            <div className={`w-20 h-20 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-2xl font-bold`}>
                                {avatar.initials}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isDoctor: false }))}
                                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                                    !formData.isDoctor
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                            >
                                Create Patient Account
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isDoctor: true }))}
                                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                                    formData.isDoctor
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                            >
                                Create Doctor Account
                            </button>
                        </div>

                        {/* Common Fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.username ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                required
                                placeholder="John Doe"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                required
                                placeholder="your@email.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Doctor Specific Fields */}
                        {formData.isDoctor && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                        required
                                        placeholder="Dr. John Doe"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Specialization
                                    </label>
                                    <select
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.specialization ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                        required
                                    >
                                        <option value="">Select a specialization</option>
                                        {SPECIALIZATIONS.map((specialization, index) => (
                                            <option key={index} value={specialization}>
                                                {specialization}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.specialization && (
                                        <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Hospital
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="hospital"
                                            value={formData.hospital}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.hospital ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all appearance-none`}
                                            required
                                        >
                                        <option value="" disabled>Select a hospital</option>
                                        <option value="National Hospital of Sri Lanka">National Hospital of Sri Lanka</option>
                                        <option value="Lady Ridgeway Hospital for Children">Lady Ridgeway Hospital for Children</option>
                                        <option value="De Soysa Hospital for Women">De Soysa Hospital for Women</option>
                                        <option value="Castle Street Hospital for Women">Castle Street Hospital for Women</option>
                                        <option value="Colombo South Teaching Hospital">Colombo South Teaching Hospital</option>
                                        <option value="Colombo North Teaching Hospital">Colombo North Teaching Hospital</option>
                                        <option value="Teaching Hospital Kandy">Teaching Hospital Kandy</option>
                                        <option value="Teaching Hospital Karapitiya">Teaching Hospital Karapitiya</option>
                                        <option value="Teaching Hospital Jaffna">Teaching Hospital Jaffna</option>
                                        <option value="Teaching Hospital Batticaloa">Teaching Hospital Batticaloa</option>
                                        <option value="Teaching Hospital Anuradhapura">Teaching Hospital Anuradhapura</option>
                                        <option value="Teaching Hospital Kurunegala">Teaching Hospital Kurunegala</option>
                                        <option value="Teaching Hospital Peradeniya">Teaching Hospital Peradeniya</option>
                                        <option value="Base Hospital Ampara">Base Hospital Ampara</option>
                                        <option value="Base Hospital Badulla">Base Hospital Badulla</option>
                                        <option value="Base Hospital Matara">Base Hospital Matara</option>
                                        <option value="Base Hospital Ratnapura">Base Hospital Ratnapura</option>
                                        <option value="Base Hospital Trincomalee">Base Hospital Trincomalee</option>
                                        <option value="Base Hospital Vavuniya">Base Hospital Vavuniya</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
                                </div>
                                {formData.hospital === "Other" && (
                                    <input
                                        type="text"
                                        name="customHospital"
                                        value={formData.customHospital || ""}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            customHospital: e.target.value,
                                            hospital: e.target.value // Update the actual hospital field
                                        }))}
                                        className="w-full px-4 py-3 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                        required
                                        placeholder="Enter hospital name"
                                    />
                                )}
                                {errors.hospital && (
                                    <p className="mt-1 text-sm text-red-500">{errors.hospital}</p>
                                )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Consultation Fee (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        name="consultationFee"
                                        value={formData.consultationFee}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.consultationFee ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                        required
                                        min="0"
                                        step="100"
                                        placeholder="2000"
                                    />
                                    {errors.consultationFee && (
                                        <p className="mt-1 text-sm text-red-500">{errors.consultationFee}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Doctor Registration Number
                                    </label>
                                    <input
                                        type="text"
                                        name="doctorReg"
                                        value={formData.doctorReg}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.doctorReg ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                        required
                                        placeholder="DR12345"
                                    />
                                    {errors.doctorReg && (
                                        <p className="mt-1 text-sm text-red-500">{errors.doctorReg}</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Patient Specific Fields */}
                        {!formData.isDoctor && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.phone ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                        required={!formData.isDoctor}
                                        placeholder="0771234567 (10 digits only)"
                                        maxLength={10}
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.address ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                        required
                                        placeholder="123 Main Street, Colombo"
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                                    )}
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.password ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                required
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all flex items-center justify-center shadow-lg hover:shadow-cyan-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : formData.isDoctor ? "Create Doctor Account" : "Create Patient Account"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                            Sign in
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}