import { useState, useEffect } from "react";
import { FiLogOut, FiCalendar, FiUser, FiUsers, FiHome, FiSearch, FiPlus, FiDownload } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import UserProfile from "../components/UserProfile";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PatientsPage() {
    const [patients, setPatients] = useState([]);
    const [activeSection, setActiveSection] = useState("Patients");
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        activePatients: 0,
        newPatients: 0,
        followUps: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setIsLoading(true);
                const userData = JSON.parse(localStorage.getItem('user'));
                
                if (!userData || !userData._id) {
                    toast.error('Please login to continue');
                    navigate('/login');
                    return;
                }

                // Fetch doctor data
                const doctorResponse = await fetch(`http://localhost:5000/api/doctors/user/${userData._id}`);
                const doctorData = await doctorResponse.json();

                if (!doctorData.success) {
                    throw new Error('Failed to fetch doctor data');
                }

                // Update userData with doctor's image
                userData.image = doctorData.data.image || "/user.jpg";
                localStorage.setItem('user', JSON.stringify(userData));

                // Fetch appointments for the doctor
                const appointmentsResponse = await fetch(`http://localhost:5000/api/appointments/doctor/${doctorData.data._id}`);
                const appointmentsData = await appointmentsResponse.json();

                if (!appointmentsData.success) {
                    throw new Error('Failed to fetch appointments');
                }

                // Process appointments to get unique patients
                const uniquePatients = new Map();
                const today = new Date();
                const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

                console.log('Appointments:', appointmentsData.appointments);
                appointmentsData.appointments.forEach(appointment => {
                    if (!uniquePatients.has(appointment.patientId._id)) {
                        uniquePatients.set(appointment.patientId._id, {
                            id: appointment.patientId._id,
                            name: appointment.name || "Unknown Patient",
                            email: appointment.email,
                            phone: appointment.phone,
                            lastVisit: appointment.date,
                            condition: appointment.reason,
                            totalAppointments: 1,
                            lastAppointmentStatus: appointment.status
                        });
                    } else {
                        const patient = uniquePatients.get(appointment.patientId._id);
                        patient.totalAppointments++;
                        if (new Date(appointment.date) > new Date(patient.lastVisit)) {
                            patient.lastVisit = appointment.date;
                            patient.condition = appointment.reason;
                            patient.lastAppointmentStatus = appointment.status;
                        }
                    }
                });

                const patientsList = Array.from(uniquePatients.values());
                setPatients(patientsList);

                // Calculate statistics
                const activePatients = patientsList.filter(p => 
                    new Date(p.lastVisit) >= thirtyDaysAgo
                ).length;

                const newPatients = patientsList.filter(p => 
                    p.totalAppointments === 1
                ).length;

                const followUps = patientsList.filter(p => 
                    p.lastAppointmentStatus === 'completed' && 
                    new Date(p.lastVisit) < today
                ).length;

                setStats({
                    activePatients,
                    newPatients,
                    followUps
                });


                console.log('Patients:', patientsList);

            } catch (error) {
                console.error('Error fetching patients:', error);
                toast.error(error.message || 'Failed to fetch patients');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [navigate]);

    const handleSectionClick = (section) => {
        setActiveSection(section);
        if (section === "Logout") {
            localStorage.removeItem('user');
            navigate("/login");
        }
    };

    const handleDownloadPatients = async () => {
        try {
            // Create a temporary div to hold the content
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);

            // Create a simple table for the PDF
            const table = document.createElement('table');
            table.style.border = '1px solid black';
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.backgroundColor = 'white';
            table.style.color = 'black';

            // Add table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Patient Name', 'Last Visit', 'Condition', 'Email', 'Phone', 'Total Appointments'].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.style.border = '1px solid black';
                th.style.padding = '8px';
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Add table body
            const tbody = document.createElement('tbody');
            patients.forEach(patient => {
                const row = document.createElement('tr');
                [
                    patient.name,
                    new Date(patient.lastVisit).toLocaleDateString(),
                    patient.condition,
                    patient.email,
                    patient.phone,
                    patient.totalAppointments
                ].forEach(cellData => {
                    const td = document.createElement('td');
                    td.textContent = cellData;
                    td.style.border = '1px solid black';
                    td.style.padding = '8px';
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            tempDiv.appendChild(table);

            // Convert to canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

            // Save PDF
            pdf.save('patients-list.pdf');

            // Clean up
            document.body.removeChild(tempDiv);

            toast.success('Patients list downloaded successfully!');
        } catch (error) {
            console.error('Error downloading patients list:', error);
            toast.error('Failed to download patients list');
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
                        <h1 className="text-3xl font-bold text-white">
                            {activeSection === "Patients" ? "Patient Management" : activeSection}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleDownloadPatients}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiDownload />
                                <span>Download List</span>
                            </button>
                            <div className="flex items-center space-x-3">
                                <img src="/health.png" alt="MediHome Logo" className="w-12 h-auto"/>
                                <h2 className="text-xl font-semibold text-blue-300">
                                    MediHome Channelling
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Search and Add Patient */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="w-1/3"></div>
                        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <FiPlus />
                            <span>Add New Patient</span>
                        </button>
                    </div>

                    {/* Patient Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { title: "Active Patients", value: stats.activePatients, description: "Last 30 days", trend: "Currently under care", color: "from-green-600 to-green-800" },
                            { title: "New Patients", value: stats.newPatients, description: "First-time visitors", trend: "This month", color: "from-blue-600 to-blue-800" },
                            { title: "Follow-ups Needed", value: stats.followUps, description: "Require attention", trend: "Pending follow-up", color: "from-amber-600 to-amber-800" },
                        ].map((card, idx) => (
                            <div 
                                key={idx} 
                                className={`p-6 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-lg transition-transform hover:scale-105`}
                            >
                                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                                <p className="text-3xl font-bold mb-1">{card.value}</p>
                                <p className="text-sm opacity-80">{card.description}</p>
                                <p className="text-xs mt-2 opacity-60">{card.trend}</p>
                            </div>
                        ))}
                    </div>

                    {/* Patients List */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-sm p-6 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Patient Records</h2>
                            <div className="text-sm text-gray-400">
                                Total Patients: {patients.length}
                            </div>
                        </div>
                        
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-white">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left pb-3 px-4">Patient Name</th>
                                            <th className="text-left pb-3 px-4">Last Visit</th>
                                            <th className="text-left pb-3 px-4">Condition</th>
                                            <th className="text-left pb-3 px-4">Contact</th>
                                            <th className="text-right pb-3 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map((patient) => (
                                            <tr key={patient.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                <td className="py-4 px-4 font-medium">{patient.name}</td>
                                                <td className="py-4 px-4">{new Date(patient.lastVisit).toLocaleDateString()}</td>
                                                <td className="py-4 px-4">
                                                    <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
                                                        {patient.condition}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col">
                                                        <a href={`mailto:${patient.email}`} className="text-blue-400 hover:underline">
                                                            {patient.email}
                                                        </a>
                                                        <span className="text-sm text-gray-400">{patient.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1 bg-blue-900/20 rounded-lg">
                                                            View
                                                        </button>
                                                        <Link 
                                                            to={`/patient-records/${patient.id}`}
                                                            className="text-purple-400 hover:text-purple-300 text-sm font-medium px-3 py-1 bg-purple-900/20 rounded-lg"
                                                        >
                                                            Records
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-sm p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Recent Patient Activity</h2>
                        <div className="space-y-4">
                            {patients
                                .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
                                .slice(0, 4)
                                .map((patient, idx) => (
                                    <div key={idx} className="flex items-start p-4 bg-gray-700/30 rounded-lg border-l-4 border-blue-500">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-blue-300">{patient.name}</span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-600">
                                                    {patient.lastAppointmentStatus === "completed" && "Completed"}
                                                    {patient.lastAppointmentStatus === "pending" && "Pending"}
                                                    {patient.lastAppointmentStatus === "cancelled" && "Cancelled"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-1">Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-400 mt-1">{patient.condition}</p>
                                        </div>
                                        <button className="text-sm text-blue-400 hover:text-blue-300">
                                            View
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}