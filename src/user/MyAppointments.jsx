import { useState, useEffect } from "react";
import {
  FiLogOut,
  FiCalendar,
  FiUser,
  FiUsers,
  FiHome,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiTrash2,
  FiRefreshCw,
  FiAlertCircle,
  FiCreditCard,
  FiDownload,
  FiFileText
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import UserProfile from "../components/UserProfile";

export default function MyAppointments() {
  const [activeSection, setActiveSection] = useState("Appointments");
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("User data from localStorage:", parsedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        toast.error("Error with user data. Please log in again.");
        navigate("/login");
      }
    } else {
      toast.error("Please log in to view appointments");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (userData && userData._id) {
      console.log("Fetching appointments for user:", userData._id);
      fetchAppointments(userData._id);
    }
  }, [userData]);

  // Add click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const reportDropdown = document.getElementById('report-dropdown');
      const summaryReportDropdown = document.getElementById('summary-report-dropdown');

      if (reportDropdown && !reportDropdown.contains(event.target) &&
          !event.target.closest('button[data-dropdown="report-dropdown"]')) {
        reportDropdown.classList.add('hidden');
      }

      if (summaryReportDropdown && !summaryReportDropdown.contains(event.target) &&
          !event.target.closest('button[data-dropdown="summary-report-dropdown"]')) {
        summaryReportDropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAppointments = async (userId) => {
    try {
      console.log("Making API request to fetch appointments for user:", userId);
      const response = await fetch(
        `http://localhost:5000/api/appointments/user/${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Appointments API response:", data);

      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        toast.error(data.error || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("An error occurred while fetching appointments");
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

  const handleDeleteAppointment = async (appointment) => {
    // Check if the appointment can be deleted
    if (!canDeleteAppointment(appointment)) {
      toast.error('Confirmed appointments cannot be deleted');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${appointment._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Appointment deleted successfully');
        // Refresh the appointments list
        fetchAppointments(userData._id);
      } else {
        toast.error(data.error || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  // Check if an appointment is past due and still pending with completed payment
  const isPastDueAndPending = (appointment) => {
    // Get current date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get appointment date (without time)
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);

    // Check if appointment is in the past, still pending, and has completed payment
    return appointmentDate < today &&
           appointment.status === "pending" &&
           appointment.paymentStatus === "completed";
  };

  // Check if an appointment is upcoming
  const isUpcomingAppointment = (appointment) => {
    // Get current date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get appointment date (without time)
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);

    // Check if appointment is today or in the future
    return appointmentDate >= today;
  };

  // Check if an appointment can be deleted
  const canDeleteAppointment = (appointment) => {
    // Confirmed appointments cannot be deleted
    return appointment.status !== "confirmed";
  };

  // Get upcoming appointments
  const getUpcomingAppointments = () => {
    return appointments.filter(appointment => isUpcomingAppointment(appointment))
                      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Format date for report
  const formatDateForReport = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // Generate and download CSV report
  const generateAppointmentReport = () => {
    try {
      const upcomingAppointments = getUpcomingAppointments();

      if (upcomingAppointments.length === 0) {
        toast.error("No upcoming appointments to generate report");
        return;
      }

      // Create CSV content
      let csvContent = "Doctor,Specialization,Hospital,Date,Time,Reference,Status,Fee\n";

      upcomingAppointments.forEach(appointment => {
        const doctorName = appointment.doctorId?.name || "Unknown Doctor";
        const specialization = appointment.doctorId?.specialization || "Not specified";
        const hospital = appointment.doctorId?.hospital || "Not specified";
        const date = formatDateForReport(appointment.date);
        const time = appointment.time || "Not specified";
        const reference = appointment.reference || "N/A";
        const status = appointment.status ?
          appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) :
          "Unknown";
        const fee = appointment.doctorId?.consultationFee ?
          `LKR ${appointment.doctorId.consultationFee.toLocaleString()}` :
          "Not specified";

        // Escape any commas in the fields
        const escapedRow = [
          `"${doctorName}"`,
          `"${specialization}"`,
          `"${hospital}"`,
          `"${date}"`,
          `"${time}"`,
          `"${reference}"`,
          `"${status}"`,
          `"${fee}"`
        ].join(',');

        csvContent += escapedRow + "\n";
      });

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Set link properties
      link.setAttribute('href', url);
      link.setAttribute('download', `upcoming_appointments_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';

      // Add to document, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Appointment report downloaded successfully");
    } catch (error) {
      console.error("Error generating appointment report:", error);
      toast.error("Failed to generate appointment report");
    }
  };

  // Generate HTML report for printing
  const generatePrintableReport = () => {
    try {
      const upcomingAppointments = getUpcomingAppointments();

      if (upcomingAppointments.length === 0) {
        toast.error("No upcoming appointments to generate report");
        return;
      }

      // Create HTML content
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Upcoming Appointments Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              text-align: center;
              margin-bottom: 20px;
            }
            .report-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .report-date {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f2f7ff;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body {
                padding: 0;
                color: black;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Upcoming Appointments Report</h1>
            <div class="report-date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Hospital</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
      `;

      upcomingAppointments.forEach(appointment => {
        const doctorName = appointment.doctorId?.name || "Unknown Doctor";
        const specialization = appointment.doctorId?.specialization || "Not specified";
        const hospital = appointment.doctorId?.hospital || "Not specified";
        const date = formatDateForReport(appointment.date);
        const time = appointment.time || "Not specified";
        const reference = appointment.reference || "N/A";
        const status = appointment.status ?
          appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) :
          "Unknown";
        const fee = appointment.doctorId?.consultationFee ?
          `LKR ${appointment.doctorId.consultationFee.toLocaleString()}` :
          "Not specified";

        htmlContent += `
              <tr>
                <td>${doctorName}</td>
                <td>${specialization}</td>
                <td>${hospital}</td>
                <td>${date}</td>
                <td>${time}</td>
                <td>${reference}</td>
                <td>${status}</td>
                <td>${fee}</td>
              </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>

          <div class="footer">
            <p>This report contains ${upcomingAppointments.length} upcoming appointment(s).</p>
            <p>MediHome - Your Health, Our Priority</p>
          </div>

          <button onclick="window.print()" style="display: block; margin: 20px auto; padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Report
          </button>
        </body>
        </html>
      `;

      // Open a new window with the HTML content
      const reportWindow = window.open('', '_blank');
      reportWindow.document.write(htmlContent);
      reportWindow.document.close();

      toast.success("Report generated successfully. A new tab has been opened with the printable report.");
    } catch (error) {
      console.error("Error generating printable report:", error);
      toast.error("Failed to generate printable report");
    }
  };

  // Handle refund request
  const handleRefundRequest = async (appointmentId, paymentReference) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Processing refund...');

      console.log('Processing refund for appointment:', appointmentId, 'with reference:', paymentReference);

      // Step 1: Flag the payment as refunded
      const paymentResponse = await fetch(`http://localhost:5000/api/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          reference: paymentReference
        })
      });

      if (!paymentResponse.ok) {
        toast.dismiss(loadingToast);
        console.error('Payment refund failed with status:', paymentResponse.status);
        toast.error(`Failed to process refund. Server returned ${paymentResponse.status}`);
        return;
      }

      const paymentData = await paymentResponse.json();
      console.log('Payment refund response:', paymentData);

      if (!paymentData.success) {
        toast.dismiss(loadingToast);
        toast.error(paymentData.error || 'Failed to process payment refund');
        return;
      }

      // Step 2: Delete the appointment
      console.log('Deleting appointment after successful refund:', appointmentId);
      const deleteResponse = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      const deleteData = await deleteResponse.json();

      if (!deleteData.success) {
        console.warn('Failed to delete appointment after refund:', deleteData.error);
        // Continue anyway since the refund was processed
      } else {
        console.log('Appointment successfully deleted after refund');
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      toast.success('Refund processed successfully and appointment removed');

      // Refresh the appointments list
      fetchAppointments();
    } catch (error) {
      toast.dismiss();
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund. Please try again later.');
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
        {/* Sidebar */}
        <aside className="w-72 bg-gray-800/80 backdrop-blur-lg p-6 text-white border-r border-gray-700 fixed h-full">
          <UserProfile />
          <ul className="space-y-4">
            {[
              {
                name: "Dashboard",
                icon: <FiHome />,
                link: "/udash",
                section: "Dashboard"
              },
              {
                name: "My Appointments",
                icon: <FiCalendar />,
                link: "/myapp",
                section: "Appointments"
              },
              {
                name: "Channel Doctor",
                icon: <FiUsers />,
                link: "/doc",
                section: "Channel"
              }
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
            <h1 className="text-3xl font-bold text-white">My Appointments</h1>

            <div className="relative">
              <button
                onClick={() => {
                  const upcomingAppointments = getUpcomingAppointments();
                  if (upcomingAppointments.length === 0) {
                    toast.error("No upcoming appointments to generate report");
                    return;
                  }

                  // Show dropdown menu with report options
                  const dropdown = document.getElementById('report-dropdown');
                  dropdown.classList.toggle('hidden');
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={isLoading || appointments.length === 0}
                data-dropdown="report-dropdown"
              >
                <FiFileText className="mr-2" />
                <span>Generate Report</span>
              </button>

              {/* Dropdown Menu */}
              <div
                id="report-dropdown"
                className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 hidden"
              >
                <ul className="py-2">
                  <li>
                    <button
                      onClick={() => {
                        document.getElementById('report-dropdown').classList.add('hidden');
                        generateAppointmentReport();
                      }}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <FiDownload className="inline mr-2" />
                      Download CSV
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        document.getElementById('report-dropdown').classList.add('hidden');
                        generatePrintableReport();
                      }}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <FiFileText className="inline mr-2" />
                      Printable Report
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

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
            <>
              {/* Upcoming Appointments Summary */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCalendar className="text-blue-400 text-xl mr-3" />
                    <div>
                      <h3 className="text-white font-semibold text-lg">Upcoming Appointments</h3>
                      <p className="text-blue-300">
                        You have {getUpcomingAppointments().length} upcoming appointment(s)
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => {
                        // Show dropdown menu with report options
                        const dropdown = document.getElementById('summary-report-dropdown');
                        dropdown.classList.toggle('hidden');
                      }}
                      className="flex items-center text-blue-300 hover:text-blue-200 transition-colors"
                      disabled={getUpcomingAppointments().length === 0}
                      data-dropdown="summary-report-dropdown"
                    >
                      <FiDownload className="mr-1" />
                      <span>Download Report</span>
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      id="summary-report-dropdown"
                      className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 hidden"
                    >
                      <ul className="py-2">
                        <li>
                          <button
                            onClick={() => {
                              document.getElementById('summary-report-dropdown').classList.add('hidden');
                              generateAppointmentReport();
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <FiDownload className="inline mr-2" />
                            Download CSV
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              document.getElementById('summary-report-dropdown').classList.add('hidden');
                              generatePrintableReport();
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <FiFileText className="inline mr-2" />
                            Printable Report
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {appointment.doctorId?.name && appointment.doctorId.name.startsWith("Dr.")
                          ? appointment.doctorId.name
                          : `Dr. ${appointment.doctorId?.name || "Unknown Doctor"}`}
                      </h2>
                      <p className="text-gray-400 mb-4">
                        {appointment.doctorId?.specialization || "Specialization not available"}
                      </p>

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
                          <span>{appointment.doctorId?.hospital || "Hospital not available"}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <FiDollarSign className="mr-2" />
                          <span>
                            LKR{" "}
                            {appointment.doctorId?.consultationFee
                              ? appointment.doctorId.consultationFee.toLocaleString()
                              : "Fee not available"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          appointment.status === "confirmed"
                            ? "bg-green-900/50 text-green-400"
                            : appointment.status === "pending"
                            ? "bg-yellow-900/50 text-yellow-400"
                            : "bg-red-900/50 text-red-400"
                        }`}
                      >
                        {appointment.status
                          ? appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)
                          : "Unknown"}
                      </span>
                      <p className="text-gray-400 text-sm mt-2">
                        Ref: {appointment.reference || "N/A"}
                      </p>

                      {/* Show refund eligibility indicator */}
                      {isPastDueAndPending(appointment) && (
                        <div className="flex items-center text-yellow-400 text-sm mt-2">
                          <FiAlertCircle className="mr-1" />
                          <span>Eligible for refund</span>
                        </div>
                      )}
                      <div className="flex flex-col items-end">
                        {isPastDueAndPending(appointment) && (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to request a refund for this appointment? The appointment will be deleted and payment will be marked as refunded.")) {
                                handleRefundRequest(appointment._id, appointment.reference);
                              }
                            }}
                            className="mt-2 flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md transition-colors"
                          >
                            <FiCreditCard className="mr-2" />
                            Request Refund
                          </button>
                        )}
                        {canDeleteAppointment(appointment) ? (
                          <button
                            onClick={() => handleDeleteAppointment(appointment)}
                            className="mt-2 flex items-center text-red-400 hover:text-red-300 transition-colors"
                          >
                            <FiTrash2 className="mr-2" />
                            Delete Appointment
                          </button>
                        ) : (
                          <div
                            className="mt-2 flex items-center text-gray-500 cursor-not-allowed relative group"
                          >
                            <FiTrash2 className="mr-2" />
                            <span>Cannot Delete</span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              Confirmed appointments cannot be deleted. Please contact support if you need to cancel this appointment.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
