import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Lottie from "lottie-react";
import loginAnimation from "../assets/login-animation.json";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
    const [transactionPassword, setTransactionPassword] = useState("");
    const [transactionError, setTransactionError] = useState("");
    const navigate = useNavigate();
    const lottieRef = useRef();

    // Hardcoded password for transactions access
    const TRANSACTION_PASSWORD = "admin123";

    const handleTransactionAccess = () => {
        if (transactionPassword === TRANSACTION_PASSWORD) {
            setShowTransactionOverlay(false);
            setTransactionPassword("");
            setTransactionError("");
            navigate("/transactions");
        } else {
            setTransactionError("Invalid password");
        }
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

    const validateForm = () => {
        const newErrors = {};
        // Email validation
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(email)) {
            if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
                newErrors.email = "No characters allowed after .com";
            } else {
                newErrors.email = "Please enter a valid email";
            }
        }
        if (!password) {
            newErrors.password = "Password is required";
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

        if (lottieRef.current) {
            lottieRef.current.play();
        }

        try {
            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.data));
                toast.success(data.message || "Login successful!");
                console.log(data.data.isDoctor)
                if (data.data.isDoctor) {
                    setTimeout(() => navigate("/dash"), 1500);
                } else {
                    setTimeout(() => navigate("/udash"), 1500);
                }
            } else {
                toast.error(data.error || "Invalid credentials");
            }
        } catch (e) {
            console.error("Login error:", e);
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
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[120px]"></div>
            </div>

            <Toaster position="top-center" />

            {/* Main Container */}
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 z-10">
                {/* Lottie Animation - Side */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex justify-center">
                    <div className="w-full max-w-md">
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={loginAnimation}
                            loop={true}
                            autoplay={true}
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Login Form */}
                <div className="w-full md:w-1/2 lg:w-2/5 max-w-md bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-300">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Check if trying to type after .com
                                    if (email.includes('.com') &&
                                        email.indexOf('.com') === email.length - 4 &&
                                        value.length > email.length) {
                                        setErrors(prev => ({
                                            ...prev,
                                            email: "No characters allowed after .com"
                                        }));
                                        return; // Don't update the email if invalid
                                    } else {
                                        setEmail(value);
                                        // Clear error if valid or empty
                                        if (errors.email) {
                                            setErrors(prev => ({
                                                ...prev,
                                                email: ""
                                            }));
                                        }
                                    }
                                }}
                                className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                                required
                                placeholder="your@email.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.password ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
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

                        <div className="flex items-center justify-between">
                            <a href="/forgetpass" className="text-sm text-blue-400 hover:text-blue-300">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <a href="/register" className="text-blue-400 hover:text-blue-300">
                            Sign up
                        </a>
                    </div>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setShowTransactionOverlay(true)}
                            className="text-sm text-gray-400 hover:text-gray-300"
                        >
                            Access Transactions
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction Password Overlay */}
            {showTransactionOverlay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">Enter Password</h3>
                        <div className="mb-4">
                            <input
                                type="password"
                                value={transactionPassword}
                                onChange={(e) => setTransactionPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                placeholder="Enter password"
                            />
                            {transactionError && (
                                <p className="mt-1 text-sm text-red-500">{transactionError}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowTransactionOverlay(false);
                                    setTransactionPassword("");
                                    setTransactionError("");
                                }}
                                className="px-4 py-2 text-gray-300 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTransactionAccess}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}