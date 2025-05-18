import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Lottie from "lottie-react";
import forgotPasswordAnimation from "../assets/orgot-password-animation.json";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState(0);
    const navigate = useNavigate();
    const lottieRef = useRef();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous error
        setError("");

        // Validate email
        if (!email) {
            setError("Email is required");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email");
            return;
        }

        // Validate new password
        if (!newPassword) {
            setError("New password is required");
            return;
        }
        
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            setError(`Password must contain ${passwordValidation.errors.join(", ")}`);
            return;
        }

        // Validate confirm password
        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        // Rate limiting - only allow one request every 60 seconds
        const now = Date.now();
        if (now - lastRequestTime < 60000) {
            const secondsLeft = Math.ceil((60000 - (now - lastRequestTime)) / 1000);
            setError(`Please wait ${secondsLeft} seconds before requesting another reset`);
            return;
        }

        setIsLoading(true);
        
        if (lottieRef.current) {
            lottieRef.current.play();
        }

        try {
            const response = await fetch("http://localhost:5000/api/forgetPass", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email,
                    newPsw: newPassword
                }),
            });

            const data = await response.json();
            if (data.success) {
                setLastRequestTime(now);
                toast.success(data.message || "Password reset successful!");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError(data.error || "Password reset failed");
            }
        } catch (e) {
            console.error("Password reset error:", e);
            setError(e.message === "Failed to fetch" 
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
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500 rounded-full blur-[120px]"></div>
            </div>

            <Toaster position="top-center" />

            {/* Main Container */}
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 z-10">
                {/* Lottie Animation - Side */}
                <div className="w-full md:w-1/2 lg:w-2/5 flex justify-center">
                    <div className="w-full max-w-md">
                        <Lottie 
                            lottieRef={lottieRef}
                            animationData={forgotPasswordAnimation}
                            loop={true}
                            autoplay={true}
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Forgot Password Form */}
                <div className="w-full md:w-1/2 lg:w-2/5 max-w-md bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                        <p className="text-gray-300">Enter your email and new password</p>
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
                                    setEmail(e.target.value);
                                    setError(""); // Clear error when user types
                                }}
                                className={`w-full px-4 py-3 bg-gray-700/50 border ${error && !email ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                required
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setError(""); // Clear error when user types
                                    }}
                                    className={`w-full px-4 py-3 bg-gray-700/50 border ${error && !newPassword ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setError(""); // Clear error when user types
                                }}
                                className={`w-full px-4 py-3 bg-gray-700/50 border ${error && !confirmPassword ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

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
                                    Resetting Password...
                                </>
                            ) : "Reset Password"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Remember your password?{' '}
                        <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                            Sign in
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}