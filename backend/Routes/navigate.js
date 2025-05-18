import { useNavigate } from "react-router-dom";

export default function Sidebar() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("Dashboard");

    const handleSectionClick = (section, path) => {
        setActiveSection(section);
        navigate(path);  // Navigate to the respective route
    };

    return (
        <ul className="space-y-6 text-lg">
            {[
                { name: "Dashboard", icon: <FiHome />, section: "Dashboard", path: "/" },
                { name: "Appointments", icon: <FiCalendar />, section: "Appointments", path: "/appointments" },
                { name: "Patients", icon: <FiUsers />, section: "Patients", path: "/patients" },
                { name: "Profile", icon: <FiUser />, section: "Profile", path: "/profile" },
            ].map((item, idx) => (
                <li
                    key={idx}
                    onClick={() => handleSectionClick(item.section, item.path)}
                    className={`flex items-center space-x-4 cursor-pointer transition-all ${
                        activeSection === item.section
                            ? "border-r-4 border-blue-400 text-blue-300"
                            : "hover:text-blue-300"
                    }`}
                >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-lg font-medium">{item.name}</span>
                </li>
            ))}

            {/* Logout */}
            <li className="flex items-center space-x-3 text-red-400 cursor-pointer mt-8 hover:text-red-300 transition-all">
                <FiLogOut className="text-xl" />
                <span>Logout</span>
            </li>
        </ul>
    );
}
