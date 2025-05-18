import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { FiCalendar, FiHome, FiLogOut, FiUser, FiUsers, FiFilter, FiMapPin, FiClock, FiCheckCircle, FiXCircle, FiDownload, FiDollarSign } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import UserProfile from "../components/UserProfile";
import LocationViewer from "../Components/LocationViewer";

export default function Appointments() {
    const [activeSection, setActiveSection] = useState("Appointments");
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState("Confirmed");
    const [isLoading, setIsLoading] = useState(true);
    const [doctorData, setDoctorData] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLocationViewerOpen, setIsLocationViewerOpen] = useState(false);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        confirmedAppointments: 0,
        pendingAppointments: 0,
        cancelledAppointments: 0
    });
    const [isReportOverlayOpen, setIsReportOverlayOpen] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
    const navigate = useNavigate();
    const lottieRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
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

                    console.log("Appointments Data:", appointmentsData); // Debugging line

                    if (appointmentsData.success) {
                        setAppointments(appointmentsData.appointments);

                        // Calculate stats
                        const stats = {
                            totalAppointments: appointmentsData.appointments.length,
                            confirmedAppointments: appointmentsData.appointments.filter(a => a.status === "confirmed").length,
                            pendingAppointments: appointmentsData.appointments.filter(a => a.status === "pending").length,
                            cancelledAppointments: appointmentsData.appointments.filter(a => a.status === "cancelled").length
                        };
                        setStats(stats);
                    } else {
                        toast.error('Failed to fetch appointments');
                    }
                } else {
                    toast.error('Failed to fetch doctor data');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Error loading data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleSectionClick = (section) => {
        setActiveSection(section);
        if (section === "Logout") {
            localStorage.removeItem('user');
            navigate("/login");
        }
    };

    const handleAccept = async (appointmentId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'confirmed' })
            });

            const data = await response.json();

            if (data.success) {
                setAppointments(prevAppointments =>
                    prevAppointments.map(appointment =>
                        appointment._id === appointmentId
                            ? { ...appointment, status: "confirmed" }
                            : appointment
                    )
                );

                // Update stats
                setStats(prevStats => ({
                    ...prevStats,
                    confirmedAppointments: prevStats.confirmedAppointments + 1,
                    pendingAppointments: prevStats.pendingAppointments - 1
                }));

                toast.success('Appointment confirmed successfully');
            } else {
                toast.error(data.error || 'Failed to confirm appointment');
            }
        } catch (error) {
            console.error('Error confirming appointment:', error);
            toast.error('Failed to confirm appointment');
        }
    };

    const handleDeny = async (appointmentId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'cancelled' })
            });

            const data = await response.json();

            if (data.success) {
                setAppointments(prevAppointments =>
                    prevAppointments.filter(appointment => appointment._id !== appointmentId)
                );

                // Update stats
                setStats(prevStats => ({
                    ...prevStats,
                    totalAppointments: prevStats.totalAppointments - 1,
                    pendingAppointments: prevStats.pendingAppointments - 1,
                    cancelledAppointments: prevStats.cancelledAppointments + 1
                }));

                toast.success('Appointment cancelled successfully');
            } else {
                toast.error(data.error || 'Failed to cancel appointment');
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            toast.error('Failed to cancel appointment');
        }
    };

    // Filter appointments based on search and date
    const filteredAppointments = appointments.filter(appointment => {
        const matchesSearch = appointment.patientId?.username?.toLowerCase().includes(search.toLowerCase()) ||
                            appointment.reference?.toLowerCase().includes(search.toLowerCase());
        const matchesDate = selectedDate ? new Date(appointment.date).toISOString().split('T')[0] === selectedDate : true;
        return matchesSearch && matchesDate;
    });

    const confirmedAppointments = filteredAppointments.filter(appointment => appointment.status === "confirmed");
    const pendingAppointments = filteredAppointments.filter(appointment => appointment.status === "pending");

    // Add this new function to handle location click
    const handleLocationClick = (location) => {
        setSelectedLocation(location);
        setIsLocationViewerOpen(true);
    };

    const handleGenerateReport = async () => {
        try {
            if (!selectedReportType) {
                toast.error('Please select a report type');
                return;
            }

            if (!doctorData?._id) {
                toast.error('Doctor data not found');
                return;
            }

            let endpoint = '';
            let params = new URLSearchParams();

            if (selectedReportType === 'income') {
                endpoint = 'http://localhost:5000/api/reports/income';
            } else {
                endpoint = 'http://localhost:5000/api/reports/appointments';
            }

            // Add doctorId to the params
            params.append('doctorId', doctorData._id);

            if (selectedTimePeriod) {
                params.append('period', selectedTimePeriod);
            }

            const response = await fetch(`${endpoint}?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate report');
            }

            // Check if the response is a PDF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('Invalid response format');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedReportType}-report-${selectedTimePeriod || 'all'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Report generated successfully');
            setIsReportOverlayOpen(false);
            setSelectedReportType(null);
            setSelectedTimePeriod('');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error.message || 'Failed to generate report');
        }
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
                            { name: "Dashboard", icon: <FiHome />, link: "/dash", section: "Dashboard" },
                            { name: "Appointments", icon: <FiCalendar />, link: "/app", section: "Appointments" },
                            { name: "Patients", icon: <FiUsers />, link: "/patients", section: "Patients" },
                            { name: "Profile", icon: <FiUser />, link: "", section: "Profile" },

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

                {/* Scrollable Main Content */}
                <main className="flex-1 bg-gray-900/50 backdrop-blur-sm ml-72 p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Appointments</h1>
                        <div className="flex items-center space-x-3">
                            <img src="/health.png" alt="MediHome Logo" className="w-12 h-auto"/>
                            <h2 className="text-xl font-semibold text-blue-300">MediHome Channelling</h2>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
                            <h3 className="text-gray-400 text-sm mb-2">Total Appointments</h3>
                            <p className="text-2xl font-bold text-white">{stats.totalAppointments}</p>
                        </div>
                        <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-6 backdrop-blur-sm">
                            <h3 className="text-green-400 text-sm mb-2">Confirmed</h3>
                            <p className="text-2xl font-bold text-green-300">{stats.confirmedAppointments}</p>
                        </div>
                        <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-6 backdrop-blur-sm">
                            <h3 className="text-amber-400 text-sm mb-2">Pending</h3>
                            <p className="text-2xl font-bold text-amber-300">{stats.pendingAppointments}</p>
                        </div>
                        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 backdrop-blur-sm">
                            <h3 className="text-red-400 text-sm mb-2">Cancelled</h3>
                            <p className="text-2xl font-bold text-red-300">{stats.cancelledAppointments}</p>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="flex gap-4 mb-8">
                        <input
                            type="text"
                            placeholder="Search by Patient Name or Reference..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-1/3 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
                            <FiFilter className="mr-2" /> Filters
                        </button>
                        <button
                            onClick={() => setIsReportOverlayOpen(true)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors ml-auto flex items-center space-x-2"
                        >
                            <FiDownload />
                            <span>Generate Report</span>
                        </button>
                    </div>

                    {/* Tabs Section */}
                    <div className="flex mb-6">
                        <button
                            className={`flex-1 px-6 py-3 text-lg font-semibold rounded-t-lg cursor-pointer transition-all ${
                                activeTab === "Confirmed"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                            }`}
                            onClick={() => setActiveTab("Confirmed")}
                        >
                            Confirmed ({stats.confirmedAppointments})
                        </button>
                        <button
                            className={`flex-1 px-6 py-3 text-lg font-semibold rounded-t-lg cursor-pointer transition-all ${
                                activeTab === "Pending"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                            }`}
                            onClick={() => setActiveTab("Pending")}
                        >
                            Pending ({stats.pendingAppointments})
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm overflow-hidden">
                            <table className="w-full text-white">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Patient Name</th>
                                        {activeTab === "Confirmed" && <th className="px-6 py-3 text-left">Reference</th>}
                                        <th className="px-6 py-3 text-left">Reason</th>
                                        <th className="px-6 py-3 text-left">Date & Time</th>
                                        <th className="px-6 py-3 text-left">Contact</th>
                                        <th className="px-6 py-3 text-left">Payment</th>
                                        {activeTab === "Pending" && <th className="px-6 py-3 text-left">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeTab === "Confirmed"
                                        ? confirmedAppointments.length > 0 ? (
                                            confirmedAppointments.map((appointment) => (
                                                <tr key={appointment._id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4">{appointment.name || appointment.patientId?.username || "Unknown"}</td>
                                                    <td className="px-6 py-4">{appointment.reference}</td>
                                                    <td className="px-6 py-4">{appointment.reason}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <FiCalendar className="mr-2 text-blue-400" />
                                                            {new Date(appointment.date).toLocaleDateString()} | {appointment.time}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span>{appointment.email}</span>
                                                            <span className="text-sm text-gray-400">{appointment.phone}</span>
                                                            <button
                                                                onClick={() => handleLocationClick(appointment.patientLocation)}
                                                                className="text-sm text-blue-400 mt-1 text-left hover:text-blue-300 transition-colors flex items-center"
                                                            >
                                                                <FiMapPin className="inline mr-1" />
                                                                {appointment.patientLocation}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            appointment.paymentStatus === "completed"
                                                                ? "bg-green-900/50 text-green-300"
                                                                : "bg-amber-900/50 text-amber-300"
                                                        }`}>
                                                            {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                                    No confirmed appointments found.
                                                </td>
                                            </tr>
                                        )
                                        : pendingAppointments.length > 0 ? (
                                            pendingAppointments.map((appointment) => (
                                                <tr key={appointment._id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4">{appointment.name || appointment.patientId?.username || "Unknown"}</td>
                                                    <td className="px-6 py-4">{appointment.reason}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <FiCalendar className="mr-2 text-blue-400" />
                                                            {new Date(appointment.date).toLocaleDateString()} | {appointment.time}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span>{appointment.email}</span>
                                                            <span className="text-sm text-gray-400">{appointment.phone}</span>
                                                            <button
                                                                onClick={() => handleLocationClick(appointment.patientLocation)}
                                                                className="text-sm text-blue-400 mt-1 text-left hover:text-blue-300 transition-colors flex items-center"
                                                            >
                                                                <FiMapPin className="inline mr-1" />
                                                                {appointment.patientLocation}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            appointment.paymentStatus === "completed"
                                                                ? "bg-green-900/50 text-green-300"
                                                                : "bg-amber-900/50 text-amber-300"
                                                        }`}>
                                                            {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleAccept(appointment._id)}
                                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center text-sm transition-colors"
                                                            >
                                                                <FiCheckCircle className="mr-1" /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeny(appointment._id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center text-sm transition-colors"
                                                            >
                                                                <FiXCircle className="mr-1" /> Deny
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                                    No pending appointments found.
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
            <Toaster position="top-right" />
            <LocationViewer
                location={selectedLocation}
                isOpen={isLocationViewerOpen}
                onClose={() => setIsLocationViewerOpen(false)}
            />
            {isReportOverlayOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-semibold text-white mb-4">Generate Report</h3>

                        {!selectedReportType ? (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setSelectedReportType('income')}
                                    className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                                >
                                    <FiDollarSign />
                                    <span>Income Report</span>
                                </button>
                                <button
                                    onClick={() => setSelectedReportType('appointments')}
                                    className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                                >
                                    <FiCalendar />
                                    <span>Appointments Report</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Select Time Period
                                    </label>
                                    <select
                                        value={selectedTimePeriod}
                                        onChange={(e) => setSelectedTimePeriod(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="year">This Year</option>
                                    </select>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            setSelectedReportType(null);
                                            setSelectedTimePeriod('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleGenerateReport}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                                    >
                                        <FiDownload />
                                        <span>Download</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setIsReportOverlayOpen(false);
                                setSelectedReportType(null);
                                setSelectedTimePeriod('');
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <FiXCircle size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}