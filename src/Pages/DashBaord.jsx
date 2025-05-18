import { useState, useEffect, useRef } from "react";
import { FiLogOut, FiCalendar, FiUser, FiUsers, FiHome, FiEdit2, FiDollarSign } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import Lottie from "lottie-react";
import { Link, useNavigate } from "react-router-dom";
import DoctorProfileOverlay from "../components/DoctorProfileOverlay";
import UserProfile from "../components/UserProfile";

export default function DoctorDashboard() {
    const [sessions, setSessions] = useState([]);
    const [activeSection, setActiveSection] = useState("Dashboard");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctorData, setDoctorData] = useState(null);
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalAppointments: 0,
        todaySessions: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const lottieRef = useRef();

    useEffect(() => {
        const fetchDashboardData = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.error('No user data found in localStorage');
                navigate('/login');
                return;
            }

            const user = JSON.parse(userStr);
            if (!user._id) {
                console.error('User object does not have _id property:', user);
                navigate('/login');
                return;
            }

            try {
                setIsLoading(true);

                // Fetch doctor data
                const doctorResponse = await fetch(`http://localhost:5000/api/doctors/user/${user._id}`);
                const doctorData = await doctorResponse.json();

                if (doctorData.success) {
                    setDoctorData(doctorData.data);

                    // Fetch doctor's appointments
                    const appointmentsResponse = await fetch(`http://localhost:5000/api/appointments/doctor/${doctorData.data._id}`);
                    const appointmentsData = await appointmentsResponse.json();

                    if (appointmentsData.success) {
                        const appointments = appointmentsData.appointments;

                        // Calculate statistics
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const todaySessions = appointments.filter(apt => {
                            const aptDate = new Date(apt.date);
                            aptDate.setHours(0, 0, 0, 0);
                            return aptDate.getTime() === today.getTime();
                        });

                        // Get unique patients
                        const uniquePatients = new Set(appointments.map(apt => apt.patientId._id));

                        setStats({
                            totalPatients: uniquePatients.size,
                            totalAppointments: appointments.length,
                            todaySessions: todaySessions.length
                        });

                        // Set upcoming sessions (next 7 days)
                        const upcomingSessions = appointments
                            .filter(apt => new Date(apt.date) >= today)
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .slice(0, 5);

                        setSessions(upcomingSessions.map(apt => ({
                            title: `Appointment with ${apt.name}`,
                            date: new Date(apt.date).toLocaleDateString(),
                            time: apt.time,
                            status: apt.status,
                            patientId: apt.patientId._id
                        })));
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleSectionClick = (section) => {
        setActiveSection(section);
        if (section === "Logout") {
            localStorage.removeItem('user');
            navigate("/login");
        }
        if (section === "Profile") setIsProfileOpen(true);
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

                    {/* Navigation Links */}
                    <nav className="mt-8 space-y-2">
                        <button
                            onClick={() => setActiveSection("Dashboard")}
                            className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                                activeSection === "Dashboard"
                                    ? "bg-blue-600/50 text-white"
                                    : "text-gray-300 hover:bg-gray-700/50"
                            }`}
                        >
                            <FiHome className="text-xl" />
                            <span>Dashboard</span>
                        </button>
                        <Link
                            to="/app"
                            className="flex items-center space-x-3 w-full p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700/50"
                        >
                            <FiCalendar className="text-xl" />
                            <span>Appoinments</span>
                        </Link>
                        <Link
                            to="/patients"
                            className="flex items-center space-x-3 w-full p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700/50"
                        >
                            <FiUsers className="text-xl" />
                            <span>Patients</span>
                        </Link>
                        <Link
                            to="/transactions"
                            className="flex items-center space-x-3 w-full p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700/50"
                        >
                            <FiDollarSign className="text-xl" />
                            <span>Transactions</span>
                        </Link>
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="flex items-center space-x-3 w-full p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700/50"
                        >
                            <FiUser className="text-xl" />
                            <span>Profile</span>
                        </button>
                        <button
                            onClick={() => handleSectionClick("Logout")}
                            className="flex items-center space-x-3 w-full p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700/50"
                        >
                            <FiLogOut className="text-xl" />
                            <span>Logout</span>
                        </button>
                    </nav>
                </aside>

                {/* Scrollable Main Content */}
                <main className="flex-1 bg-gray-900/50 backdrop-blur-sm ml-72 p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">
                            {activeSection === "Dashboard" ? "Dashboard" : activeSection}
                        </h1>
                        <div className="flex items-center space-x-3">
                            <img src="/health.png" alt="MediHome Logo" className="w-12 h-auto"/>
                            <h2 className="text-xl font-semibold text-blue-300">
                                MediHome Channelling
                            </h2>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Welcome Banner */}
                            <div
                                className="relative bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-8 h-48 flex items-center overflow-hidden"
                                style={{
                                    background: "url('https://img.freepik.com/premium-photo/doctor-is-using-show-screen-medical-diagnostic-analysis-modern-virtual-screen-network-connection-medical-technology-concept_233554-1888.jpg?semt=ais_hybrid') center/cover",
                                }}
                            >
                                <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-sm"></div>
                                <h1 className="text-4xl font-bold text-white relative z-10">
                                    Welcome, <span className="text-blue-300">{doctorData?.name || "Doctor"}</span>
                                </h1>
                            </div>

                            {/* Status Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {[
                                    { title: "Total Patients", value: stats.totalPatients, icon: <FiUsers className="text-3xl" />, color: "from-blue-600 to-blue-800" },
                                    { title: "Total Appointments", value: stats.totalAppointments, icon: <FiCalendar className="text-3xl" />, color: "from-purple-600 to-purple-800" },
                                    { title: "Today's Sessions", value: stats.todaySessions, icon: <FiCalendar className="text-3xl" />, color: "from-cyan-600 to-cyan-800" },
                                ].map((card, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-6 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-lg flex items-center space-x-4 transition-transform hover:scale-105`}
                                    >
                                        <div className="p-3 bg-white/10 rounded-full">{card.icon}</div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{card.title}</h3>
                                            <p className="text-2xl font-bold">{card.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Upcoming Sessions */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-sm p-6 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">Upcoming Sessions</h2>
                                    <Link to="/my-appointments" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                        View All
                                    </Link>
                                </div>

                                {sessions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-white">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left pb-3 px-4">Title</th>
                                                    <th className="text-left pb-3 px-4">Date</th>
                                                    <th className="text-left pb-3 px-4">Time</th>
                                                    <th className="text-left pb-3 px-4">Status</th>
                                                    <th className="text-right pb-3 px-4">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sessions.map((session, idx) => (
                                                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                        <td className="py-3 px-4">{session.title}</td>
                                                        <td className="py-3 px-4">{session.date}</td>
                                                        <td className="py-3 px-4">{session.time}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                session.status === "confirmed"
                                                                    ? "bg-green-900/50 text-green-300"
                                                                    : "bg-amber-900/50 text-amber-300"
                                                            }`}>
                                                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <Link
                                                                to={`/my-appointments`}
                                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                            >
                                                                Details
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No upcoming sessions scheduled.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Doctor Profile Overlay */}
            <DoctorProfileOverlay
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                userId={JSON.parse(localStorage.getItem('user'))?._id}
                existingData={doctorData}
            />
        </div>
    );
}