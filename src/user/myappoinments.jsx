import { useState, useEffect } from "react";
import { FiLogOut, FiCalendar, FiUser, FiUsers, FiHome, FiClock, FiMapPin, FiDollarSign } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import UserProfile from "../components/UserProfile";

export default function MyAppointments() {
    const [activeSection, setActiveSection] = useState("Appointments");
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            // Get user data from sessionStorage
            const userDataString = sessionStorage.getItem('user');
            console.log("User Data:", userDataString); // Debugging line
            if (!userDataString) {
                toast.error("Please log in to view appointments");
                return;
            }

            const userData = JSON.parse(userDataString);
            if (!userData || !userData._id) {
                toast.error("Invalid user data. Please log in again");
                return;
            }

            // Fetch appointments for the user
            const response = await fetch(`http://localhost:5000/api/appointments/user/${userData._id}`);
            const data = await response.json();

            if (data.success) {
                setAppointments(data.appointments);
            } else {
                toast.error(data.message || "Failed to fetch appointments");
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast.error("An error occurred while fetching appointments");
        } finally {
            setIsLoading(false);
        }
    };



    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

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

                    {/* Navigation */}
                    <ul className="space-y-4">
                        {[
                            { name: "Dashboard", icon: <FiHome />, link: "/user-dashboard", section: "Dashboard" },
                            { name: "My Appointments", icon: <FiCalendar />, link: "/my-appointments", section: "Appointments" },
                            { name: "Channel Doctor", icon: <FiUsers />, link: "/channel-doctor", section: "Channel" },
                            { name: "Profile", icon: <FiUser />, link: "/profile", section: "Profile" },
                        ].map((item, idx) => (
                            <li
                                key={idx}
                                onClick={() => handleSectionClick(item.section)}
                                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    activeSection === item.section
                                        ? "bg-blue-900/50 text-blue-300"
                                        : "hover:bg-gray-700/50 hover:text-blue-300"
                                }`}
                            >
                                <Link to={item.link} className="flex items-center space-x-3 w-full">
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-base font-medium">{item.name}</span>
                                </Link>
                            </li>
                        ))}

                        {/* Logout Option */}
                        <li 
                            onClick={() => handleSectionClick("Logout")}
                            className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer text-red-400 hover:bg-gray-700/50 hover:text-red-300 transition-all mt-8"
                        >
                            <span className="text-xl"><FiLogOut /></span>
                            <span className="text-base font-medium">Logout</span>
                        </li>
                    </ul>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-gray-900/50 backdrop-blur-sm ml-72 p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">My Appointments</h1>
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            <FiCalendar className="text-6xl mx-auto mb-4" />
                            <p className="text-xl">No appointments found</p>
                            <Link 
                                to="/channel-doctor" 
                                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
                            >
                                Book an appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {appointments.map((appointment) => (
                                <div 
                                    key={appointment._id}
                                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-2">
                                                Dr. {appointment.doctorId.name}
                                            </h2>
                                            <p className="text-gray-400 mb-4">{appointment.doctorId.specialization}</p>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center text-gray-300">
                                                    <FiCalendar className="mr-2" />
                                                    <span>{formatDate(appointment.date)}</span>
                                                </div>
                                                <div className="flex items-center text-gray-300">
                                                    <FiClock className="mr-2" />
                                                    <span>{appointment.time}</span>
                                                </div>
                                                <div className="flex items-center text-gray-300">
                                                    <FiMapPin className="mr-2" />
                                                    <span>{appointment.doctorId.hospital}</span>
                                                </div>
                                                <div className="flex items-center text-gray-300">
                                                    <FiDollarSign className="mr-2" />
                                                    <span>LKR {appointment.doctorId.consultationFee.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                appointment.status === 'confirmed' 
                                                    ? 'bg-green-900/50 text-green-400'
                                                    : appointment.status === 'pending'
                                                    ? 'bg-yellow-900/50 text-yellow-400'
                                                    : 'bg-red-900/50 text-red-400'
                                            }`}>
                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            </span>
                                            <p className="text-gray-400 text-sm mt-2">
                                                Ref: {appointment.reference}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
} 