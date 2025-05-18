import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiArrowLeft, FiUserPlus, FiPhone, FiMapPin, FiAlertCircle } from 'react-icons/fi';

export default function PatientSignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        address: '',
        role: 'patient'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateUsername = (username) => {
        if (username.length < 2) return "Username must be at least 2 characters long";
        if (!/^[a-zA-Z\s]*$/.test(username)) return "Username can only contain letters and spaces (no numbers or symbols)";
        return "";
    };

    const validateEmail = (email) => {
        // Basic email validation
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Check if email ends with .com and has no characters after it
        if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
            return false;
        }

        return re.test(email);
    };

    const validatePhone = (phone) => {
        // Check if it's only digits
        if (!/^\d+$/.test(phone)) {
            return "Phone number can only contain digits";
        }

        // Check if it's exactly 10 digits
        if (phone.length !== 10) {
            return "Phone number must be exactly 10 digits";
        }

        // Check if it starts with 0
        if (!phone.startsWith('0')) {
            return "Phone number must start with 0";
        }

        // Check if it starts with 07 (for mobile numbers)
        if (!phone.startsWith('07')) {
            return "Please enter a valid mobile number starting with 07";
        }

        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

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
        // Validate phone number as user types
        else if (name === 'phone') {
            // Only allow digits
            const cleaned = value.replace(/\D/g, '');

            // If the user tried to enter non-digits, show an error
            if (value !== cleaned) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Phone number can only contain digits"
                }));
            } else {
                // Clear the error if it was about non-digits
                if (errors[name] === "Phone number can only contain digits") {
                    setErrors(prev => ({
                        ...prev,
                        [name]: ""
                    }));
                }
            }

            // Enforce 10 digit limit
            if (cleaned.length > 10) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Phone number cannot exceed 10 digits"
                }));
                return; // Don't update if already at 10 digits
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
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));

            // Clear error when user starts typing (for fields other than username, email, and phone)
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ""
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate username
        const usernameError = validateUsername(formData.username);
        if (usernameError) {
            setErrors(prev => ({
                ...prev,
                username: usernameError
            }));
            return;
        }

        // Validate email
        if (!validateEmail(formData.email)) {
            if (formData.email.includes('.com') && formData.email.indexOf('.com') !== formData.email.length - 4) {
                setErrors(prev => ({
                    ...prev,
                    email: "No characters allowed after .com"
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    email: "Please enter a valid email"
                }));
            }
            return;
        }

        // Validate phone number
        const phoneError = validatePhone(formData.phone);
        if (phoneError) {
            setErrors(prev => ({
                ...prev,
                phone: phoneError
            }));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Patient account created successfully');
                navigate('/login');
            } else {
                throw new Error(data.error || 'Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error(error.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/signup" className="text-gray-400 hover:text-white transition-colors">
                            <FiArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl font-bold text-center flex-1">Patient Sign Up</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className={`w-full bg-gray-700 border ${errors.username ? 'border-red-500' : 'border-gray-600'} rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Enter your username (letters only)"
                                />
                            </div>
                            {errors.username && (
                                <div className="mt-1 flex items-center text-red-500 text-sm">
                                    <FiAlertCircle className="mr-1" />
                                    <span>{errors.username}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className={`w-full bg-gray-700 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Enter your email (ends with .com)"
                                />
                            </div>
                            {errors.email && (
                                <div className="mt-1 flex items-center text-red-500 text-sm">
                                    <FiAlertCircle className="mr-1" />
                                    <span>{errors.email}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className={`w-full bg-gray-700 border ${errors.phone ? 'border-red-500' : 'border-gray-600'} rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="0771234567 (10 digits only)"
                                    maxLength={10}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                />
                            </div>
                            {errors.phone && (
                                <div className="mt-1 flex items-center text-red-500 text-sm">
                                    <FiAlertCircle className="mr-1" />
                                    <span>{errors.phone}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Address
                            </label>
                            <div className="relative">
                                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiUserPlus />
                                    Create Patient Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-500 hover:text-blue-400">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}