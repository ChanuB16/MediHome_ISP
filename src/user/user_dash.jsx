import { useState, useEffect } from "react";
import { FiLogOut, FiCalendar, FiUser, FiUsers, FiHome, FiSearch, FiPlus, FiClock, FiMapPin, FiDollarSign, FiImage } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import UserProfile from "../components/UserProfile";
import ProfileSection from "../components/ProfileSection";
import { generateAvatar } from "../utils/avatarGenerator";

export default function  UserDashboard() {
    const [activeSection, setActiveSection] = useState("Dashboard");
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [stats, setStats] = useState({
        upcomingAppointments: 0,
        doctorsConsulted: 0,
        prescriptions: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData._id) {
            toast.error("Please log in to view dashboard");
            navigate("/login");
            return;
        }

        fetchUserData(userData._id);
    }, [navigate]);

    const fetchUserData = async (userId) => {
        try {
            setIsLoading(true);

            // Fetch upcoming appointments
            const appointmentsResponse = await fetch(`http://localhost:5000/api/appointments/user/${userId}`);
            const appointmentsData = await appointmentsResponse.json();

            if (appointmentsData.success) {
                // Filter upcoming appointments (future dates)
                const today = new Date();
                const upcoming = appointmentsData.appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.date);
                    return appointmentDate >= today;
                });

                setUpcomingAppointments(upcoming);
                setStats(prev => ({
                    ...prev,
                    upcomingAppointments: upcoming.length
                }));
            }

            // Fetch doctors
            const doctorsResponse = await fetch('http://localhost:5000/api/doctors/all');
            const doctorsData = await doctorsResponse.json();

            if (doctorsData.success) {
                setDoctors(doctorsData.data);
                // Count unique doctors from appointments
                const uniqueDoctors = new Set(appointmentsData.appointments.map(app => app.doctorId._id));
                setStats(prev => ({
                    ...prev,
                    doctorsConsulted: uniqueDoctors.size
                }));
            }

            // For now, prescriptions count is static
            setStats(prev => ({
                ...prev,
                prescriptions: 0 // This would come from a prescriptions API in a real app
            }));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSectionClick = (section) => {
        setActiveSection(section);
        if (section === "Logout") {
            localStorage.removeItem("user");
            navigate("/login");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden opacity-30">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[120px]"></div>
            </div>

            <div className="flex flex-1 z-10">
                {/* Sidebar */}
                <aside className="w-72 bg-gray-800/80 backdrop-blur-lg p-6 text-white border-r border-gray-700 fixed h-full">
                    <UserProfile key={JSON.stringify(localStorage.getItem('user'))} />

                    {/* Navigation */}
                    <ul className="space-y-4">
                        {[
                            { name: "Dashboard", icon: <FiHome />, link: "/udash", section: "Dashboard" },
                            { name: "My Appointments", icon: <FiCalendar />, link: "/myapp", section: "Appointments" },
                            { name: "Channel Doctor", icon: <FiUsers />, link: "/doc", section: "Channel" },
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

                        <li
                            onClick={() => handleSectionClick("Logout")}
                            className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer text-red-400 hover:bg-gray-700/50 hover:text-red-300 transition-all mt-8"
                        >
                            <span className="text-xl">
                                <FiLogOut />
                            </span>
                            <span className="text-base font-medium">Logout</span>
                        </li>
                    </ul>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-gray-900/50 backdrop-blur-sm ml-72 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiImage />
                                <span>Update Profile Picture</span>
                            </button>
                            <button
                                onClick={() => {
                                    const userData = JSON.parse(localStorage.getItem('user'));
                                    if (userData && userData._id) {
                                        navigate(`/patient-records/${userData._id}`);
                                    } else {
                                        toast.error("Please log in to update medical details");
                                    }
                                }}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiPlus />
                                <span>Update Medical Details</span>
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {[
                                    { title: "Upcoming Appointments", value: stats.upcomingAppointments, icon: <FiCalendar className="text-3xl" />, color: "from-blue-600 to-blue-800" },
                                    { title: "Doctors Consulted", value: stats.doctorsConsulted, icon: <FiUser className="text-3xl" />, color: "from-purple-600 to-purple-800" },
                                    { title: "Prescriptions", value: stats.prescriptions, icon: <FiClock className="text-3xl" />, color: "from-cyan-600 to-cyan-800" },
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

                            {/* Upcoming Appointments */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-sm p-6 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">Upcoming Appointments</h2>
                                    <Link to="/myapp" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                        View All
                                    </Link>
                                </div>

                                {upcomingAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingAppointments.map((appointment) => {
                                            const avatar = generateAvatar(appointment.doctorId?.name || '');
                                            return (
                                                <div key={appointment._id} className="flex items-center p-4 bg-gray-700/30 rounded-xl">
                                                    <div className={`w-16 h-16 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-2xl font-bold mr-4`}>
                                                        {avatar.initials}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-blue-300">
                                                            {appointment.doctorId?.name && appointment.doctorId.name.startsWith("Dr.")
                                                              ? appointment.doctorId.name
                                                              : `Dr. ${appointment.doctorId?.name || "Unknown Doctor"}`}
                                                        </h3>
                                                        <p className="text-sm text-gray-300">{appointment.doctorId?.specialization}</p>
                                                        <div className="flex items-center mt-2 text-sm">
                                                            <span className="text-gray-400 mr-4">{formatDate(appointment.date)}</span>
                                                            <span className="text-gray-400 mr-4">{appointment.time}</span>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                appointment.status === "confirmed"
                                                                    ? "bg-green-900/50 text-green-300"
                                                                    : "bg-amber-900/50 text-amber-300"
                                                            }`}>
                                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-400">{appointment.doctorId?.hospital}</p>
                                                        <Link
                                                            to={`/myapp`}
                                                            className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No upcoming appointments. Book one now!
                                    </div>
                                )}
                            </div>

                            {/* Channel a Doctor Section */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">Channel a Doctor</h2>
                                    <Link to="/doc" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                        Browse All Doctors
                                    </Link>
                                </div>

                                {/* Search Bar */}
                                <div className="relative mb-6">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search doctors by name or specialty..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Doctors Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredDoctors.map((doctor) => {
                                        const avatar = generateAvatar(doctor.name);
                                        return (
                                            <div key={doctor._id} className="bg-gray-700/30 rounded-xl overflow-hidden">
                                                <div className="h-48 flex items-center justify-center bg-gray-800">
                                                    {doctor.image ? (
                                                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-700">
                                                            <img
                                                                src={doctor.image.startsWith('http') ? doctor.image : `http://localhost:5000${doctor.image}`}
                                                                alt={doctor.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    // Fall back to avatar if image fails to load
                                                                    e.target.parentNode.innerHTML = `<div class="w-32 h-32 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-4xl font-bold">${avatar.initials}</div>`;
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-32 h-32 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-4xl font-bold`}>
                                                            {avatar.initials}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="text-lg font-semibold text-white mb-1">{doctor.name}</h3>
                                                    <p className="text-gray-400 mb-2">{doctor.specialization}</p>
                                                    <div className="flex items-center text-gray-300 mb-2">
                                                        <FiMapPin className="mr-2" />
                                                        <span>{doctor.hospital}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-300 mb-4">
                                                        <FiDollarSign className="mr-2" />
                                                        <span>LKR {doctor.consultationFee.toLocaleString()}</span>
                                                    </div>
                                                    <div className="px-4 pb-4">
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {doctor.availability?.map((day, idx) => (
                                                                <span key={idx} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                                                                    {day.day}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <Link
                                                            to={`/book/${doctor._id}`}
                                                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-center"
                                                        >
                                                            Book Appointment
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {filteredDoctors.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        No doctors found matching your search.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Profile Update Modal */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="animate-fadeIn">
                        <ProfileSection onClose={() => setIsProfileOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}