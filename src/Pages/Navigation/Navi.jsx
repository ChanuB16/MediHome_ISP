import {Calendar, LayoutDashboard, UserCheck, Users} from "lucide-react";
import {FiCalendar, FiHome, FiLogOut, FiUser, FiUsers} from "react-icons/fi";

<aside className="w-72 bg-blue-950 backdrop-blur-lg p-6 text-white shadow-xl">
    {/* User Profile */}
    <div className="flex flex-col items-center mt-10 mb-8">
        <img
            src="../assets/doctor.jpg"  // Replace with actual user image
            alt="Doctor"
            className="w-28 h-28 rounded-full border-4 border-white"
        />
        <h2 className="text-2xl font-bold mt-5">Dr. John Doe</h2>
    </div>

    <ul className="space-y-12 text-2xl mt-6">
        {[
            { name: "Dashboard", icon: <FiHome />, link: "#", section: "Dashboard" },
            { name: "Appointments", icon: <FiCalendar />, link: "#", section: "Appointments" },
            { name: "Patients", icon: <FiUsers />, link: "#", section: "Patients" },
            { name: "Profile", icon: <FiUser />, link: "#", section: "Profile" },
        ].map((item, idx) => (
            <li
                key={idx}
                //onClick={() => handleSectionClick(item.section)}
              //  className={`flex items-center space-x-4 cursor-pointer transition-all ${
                   // activeSection === item.section
                        //? "border-r-4 border-blue-400 text-blue-300"  // Highlight active section with blue
                        //: "hover:text-blue-300"  // Hover effect for inactive items
             // />  }`}
            >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-lg font-medium">{item.name}</span>
            </li>
    ))}

        {/* Logout Option */}
        <li className="flex items-center space-x-4 text-red-400 cursor-pointer mt-8 hover:text-red-300 transition-all">
            <span className="text-2xl"><FiLogOut /></span>
            <span className="text-lg font-medium">Logout</span>
        </li>
    </ul>
</aside>