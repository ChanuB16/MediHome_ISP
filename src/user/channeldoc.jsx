import { useState, useEffect } from "react";
import { FiLogOut, FiCalendar, FiUser, FiUsers, FiHome, FiSearch, FiFilter, FiStar, FiMapPin, FiClock, FiPlus, FiDownload } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import UserProfile from "../components/UserProfile";
import { generateAvatar } from "../utils/avatarGenerator";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format, startOfWeek, addDays } from 'date-fns';

export default function ChannelDoctorPage() {
    const [activeSection, setActiveSection] = useState("Channel");
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        specialty: "",
        hospital: "",
        availability: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
            console.log("User data:", JSON.parse(storedUser));
        }
    }, []);
    const fetchDoctors = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/doctors/all');
            const data = await response.json();
            if (data.success) {
                setDoctors(data.data);
            } else {
                console.error('Failed to fetch doctors:', data.error);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSectionClick = (section) => {
        setActiveSection(section);
        if (section === "Logout") navigate("/login");
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetFilters = () => {
        setFilters({
            specialty: "",
            hospital: "",
            availability: ""
        });
    };

    const filteredDoctors = doctors.filter(doctor => {
        // Search term filter
        const matchesSearch =
            doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());

        // Specialty filter
        const matchesSpecialty =
            !filters.specialty || doctor.specialization === filters.specialty;

        // Hospital filter
        const matchesHospital =
            !filters.hospital || doctor.hospital.includes(filters.hospital);

        // Availability filter
        const matchesAvailability =
            !filters.availability || doctor.availability.some(day => {
                // Check in displayDate (new format)
                if (day.displayDate) {
                    return day.displayDate.toLowerCase().includes(filters.availability.toLowerCase());
                }
                // Check in dayName (new format)
                if (day.dayName) {
                    return day.dayName.toLowerCase().includes(filters.availability.toLowerCase());
                }
                // Fall back to day (old format)
                return day.day && day.day.toLowerCase().includes(filters.availability.toLowerCase());
            });

        return matchesSearch && matchesSpecialty && matchesHospital && matchesAvailability;
    });

    const specialties = [...new Set(doctors.map(doctor => doctor.specialization))];
    const hospitals = [...new Set(doctors.map(doctor => doctor.hospital))];

    // Generate current week dates for the availability filter
    const generateCurrentWeekDates = () => {
        const today = new Date();
        const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday

        return Array.from({ length: 7 }, (_, i) => {
            const date = addDays(startDate, i);
            return {
                date: format(date, 'yyyy-MM-dd'),
                displayDate: format(date, 'EEE, MMM d'), // e.g., "Mon, Jan 1"
                dayName: format(date, 'EEEE') // e.g., "Monday"
            };
        });
    };

    // Combine traditional day names with current week dates
    const weekDates = generateCurrentWeekDates();
    const availableDays = [
        ...weekDates.map(date => date.displayDate),
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    const handleDownloadDoctors = async () => {
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
            ['Name', 'Specialization', 'Hospital', 'Experience', 'Fee'].forEach(header => {
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
            filteredDoctors.forEach(doctor => {
                const row = document.createElement('tr');
                [
                    doctor.name,
                    doctor.specialization,
                    doctor.hospital,
                    `${doctor.experience} years`,
                    `LKR ${doctor.consultationFee.toLocaleString()}`
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
            pdf.save('doctors-list.pdf');

            // Clean up
            document.body.removeChild(tempDiv);

            toast.success('Doctors list downloaded successfully!');
        } catch (error) {
            console.error('Error downloading doctors list:', error);
            toast.error('Failed to download doctors list');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading doctors...</div>
            </div>
        );
    }

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
                        <h1 className="text-3xl font-bold text-white">Channel a Doctor</h1>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleDownloadDoctors}
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

                    {/* Search and Filter Bar */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search doctors by name or specialty..."
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiFilter />
                                <span>Filters</span>
                            </button>
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Specialty</label>
                                        <select
                                            name="specialty"
                                            value={filters.specialty}
                                            onChange={handleFilterChange}
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Specialties</option>
                                            {specialties.map((spec, idx) => (
                                                <option key={idx} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Hospital</label>
                                        <select
                                            name="hospital"
                                            value={filters.hospital}
                                            onChange={handleFilterChange}
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Hospitals</option>
                                            {hospitals.map((hosp, idx) => (
                                                <option key={idx} value={hosp}>{hosp}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Availability</label>
                                        <select
                                            name="availability"
                                            value={filters.availability}
                                            onChange={handleFilterChange}
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Any Day</option>
                                            {availableDays.map((day, idx) => (
                                                <option key={idx} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={resetFilters}
                                        className="text-gray-400 hover:text-gray-300 text-sm font-medium mr-4"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Doctors Grid */}
                    {filteredDoctors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDoctors.map((doctor) => {
                                const avatar = generateAvatar(doctor.name);
                                return (
                                    <div key={doctor._id} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 transition-colors">
                                        {/* Doctor Header */}
                                        <div className="p-6">
                                            <div className="flex items-start">
                                                {doctor.image ? (
                                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 mr-6 cursor-pointer hover:border-blue-400 transition-colors">
                                                        <img
                                                            src={doctor.image.startsWith('http') ? doctor.image : `http://localhost:5000${doctor.image}`}
                                                            alt={doctor.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                // Fall back to avatar if image fails to load
                                                                e.target.parentNode.innerHTML = `<div class="w-24 h-24 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-4xl font-bold">${avatar.initials}</div>`;
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`w-24 h-24 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-4xl font-bold mr-6 cursor-pointer hover:border-blue-400 transition-colors`}>
                                                        {avatar.initials}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-xl text-blue-300">{doctor.name}</h3>
                                                    <p className="text-gray-300">{doctor.specialization}</p>
                                                    <div className="flex items-center mt-1">
                                                        <FiStar className="text-yellow-400 mr-1" />
                                                        <span>4.8</span>
                                                        <span className="text-gray-400 text-sm ml-1">(124 reviews)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Doctor Details */}
                                        <div className="px-6 pb-4 border-t border-gray-700">
                                            <div className="space-y-3">
                                                <div className="flex items-start">
                                                    <FiMapPin className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                                    <p className="text-gray-300">{doctor.hospital}</p>
                                                </div>
                                                <div className="flex items-start">
                                                    <FiClock className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-gray-300">Available:</p>
                                                        <p className="text-sm text-gray-400">
                                                            {doctor.availability.map(day => {
                                                                // Use displayDate if available (new format)
                                                                if (day.displayDate) {
                                                                    return day.displayDate;
                                                                }
                                                                // Fall back to old format with day names
                                                                return day.day;
                                                            }).filter(day => day).join(", ")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start">
                                                    <FiUser className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                                    <p className="text-gray-300">{doctor.experience} years experience</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Doctor Footer */}
                                        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-gray-400">Consultation Fee:</p>
                                                    <p className="text-lg font-bold">LKR {doctor.consultationFee.toLocaleString()}</p>
                                                </div>
                                                <Link
                                                    to={`/book/${doctor._id}`}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                                                >
                                                    <FiPlus className="mr-2" />
                                                    Book Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                No doctors found matching your search criteria.
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    resetFilters();
                                }}
                                className="text-blue-400 hover:text-blue-300 font-medium"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {/* Specialty Sections */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Browse by Specialty</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {specialties.map((specialty, idx) => {
                                // Get the appropriate icon based on specialty
                                const getSpecialtyIcon = (specialty) => {
                                    const specialtyLower = specialty.toLowerCase();
                                    if (specialtyLower.includes('cardio')) return '❤️';
                                    if (specialtyLower.includes('derma')) return '🧴';
                                    if (specialtyLower.includes('neuro')) return '🧠';
                                    if (specialtyLower.includes('pediat')) return '👶';
                                    if (specialtyLower.includes('ortho')) return '🦴';
                                    if (specialtyLower.includes('gyne')) return '🌸';
                                    if (specialtyLower.includes('dent')) return '🦷';
                                    if (specialtyLower.includes('eye') || specialtyLower.includes('ophthal')) return '👁️';
                                    if (specialtyLower.includes('ent')) return '👂';
                                    if (specialtyLower.includes('psych')) return '🧘';
                                    if (specialtyLower.includes('physio')) return '💪';
                                    if (specialtyLower.includes('onco')) return '🔬';
                                    if (specialtyLower.includes('urol')) return '🔍';
                                    if (specialtyLower.includes('surg')) return '🔪';
                                    return '🩺'; // Default medical icon
                                };

                                return (
                                    <Link
                                        key={idx}
                                        to={`/channel-doctor?specialty=${specialty}`}
                                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
                                        onClick={() => setFilters({...filters, specialty: specialty})}
                                    >
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3">{getSpecialtyIcon(specialty)}</span>
                                            <div>
                                                <h3 className="font-medium">{specialty}</h3>
                                                <p className="text-sm text-gray-400">
                                                    {doctors.filter(d => d.specialization === specialty).length} doctors
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}