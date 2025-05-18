import React from "react";
import { Link } from "react-router-dom";

const MediHomeWelcome = () => {
    return (
        <div
            className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center relative text-white"
            style={{
                backgroundImage: `url('https://img.freepik.com/premium-photo/doctor-is-using-show-screen-medical-diagnostic-analysis-modern-virtual-screen-network-connection-medical-technology-concept_233554-1888.jpg?semt=ais_hybrid')`,
                backgroundColor: '#0f172a' // Fallback color if image doesn't load
            }}
        >
            {/* Logo in top right corner */}
            <div className="absolute top-4 right-4">
                <img
                    src="/health.png" // Change to your logo image path
                    alt="MediHome Logo"
                    className="h-16 w-auto"
                />
            </div>

            {/* Welcome message */}
            <div className="text-center backdrop-blur-sm bg-black/50 p-10 rounded-2xl shadow-lg max-w-2xl">
                <h1 className="text-5xl font-bold mb-4 text-white">Welcome to <span className="text-blue-400">MediHome</span></h1>
                <p className="text-xl mb-8 text-gray-200">Your trusted partner in healthcare management. Connect with doctors, schedule appointments, and manage your health records all in one place.</p>
                <div className="flex gap-6 justify-center">
                    <Link to="/login">
                        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl text-white font-medium shadow-lg transition duration-300 transform hover:scale-105">
                            Login
                        </button>
                    </Link>
                    <Link to="/register">
                        <button className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl text-white font-medium shadow-lg transition duration-300 transform hover:scale-105">
                            Sign Up
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MediHomeWelcome;
