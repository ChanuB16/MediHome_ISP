import { Routes, Route, useLocation} from "react-router-dom";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import ForgetPass from "./auth/ForgetPass.jsx";
import Dashboard from "./Pages/DashBaord.jsx";
import Appointments from "./Pages/Appoinments.jsx";
import Patients from "./Pages/Patients.jsx";
import UserDashboard from "./user/user_dash.jsx";
import MyAppoinments from "./user/MyAppointments.jsx";
import Mydochan from "./user/channeldoc.jsx";
import Book from "./user/book.jsx"
import Pay from "./user/Pay.jsx"
import DoctorProfileOverlay from "./components/DoctorProfileOverlay.jsx";
import Transactions from './Pages/Transactions';
import PatientRecordsPage from './Pages/PatientRecordsPage.jsx';
import UpdateMedicalDetails from "./user/UpdateMedicalDetails";
import Welcome from "./Pages/Welcome.jsx";

export default function App() {
    const location = useLocation();
    const noScrollPages = ["/login", "/register", "/forgetpassword"];
    const isNoScrollPage = noScrollPages.includes(location.pathname);

    return (
        <>
            <div className={`${isNoScrollPage ? "overflow-hidden" : "overflow-auto"} min-h-screen`}>
            <Routes>
                {/* Default Route - Redirect to Welcome */}
                <Route path="/" element={<Welcome />} />

                {/* Authentication Routes */}
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgetpass" element={<ForgetPass />} />

                {/* Main Admin Routes */}
                <Route path="/dash" element={<Dashboard />} />
                <Route path="/app" element={<Appointments/>} />
                <Route path="/patients" element={<Patients />}/>
                <Route path="/patient-records/:patientId" element={<PatientRecordsPage />} />

                <Route path="/udash" element={<UserDashboard />} />
                <Route path="/myapp" element={<MyAppoinments />} />
                <Route path="/doc" element={<Mydochan />} />
                <Route path="/book/:id" element={<Book />} />
                <Route path="/pay" element={<Pay />} />
                <Route path="/doctor-profile" element={<DoctorProfileOverlay />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/update-medical-details" element={<UpdateMedicalDetails />} />

            </Routes>
            </div>
        </>
    );
}
