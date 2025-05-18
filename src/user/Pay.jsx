import { useState, useEffect } from "react";
import { FiCreditCard, FiCheckCircle, FiArrowLeft, FiLoader, FiAlertCircle, FiCalendar } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

export default function PaymentPortal() {
    const navigate = useNavigate();
    const location = useLocation();
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [expiryMonth, setExpiryMonth] = useState("");
    const [expiryYear, setExpiryYear] = useState("");
    const [cvv, setCvv] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [appointmentDetails, setAppointmentDetails] = useState(null);
    const [reference, setReference] = useState("");

    useEffect(() => {
        const pendingAppointment = sessionStorage.getItem('pendingAppointment');
        if (!pendingAppointment) {
            toast.error("No appointment details found");
            navigate('/doc');
            return;
        }

        try {
            const appointmentData = JSON.parse(pendingAppointment);

            // Validate required data
            if (!appointmentData.doctorDetails || !appointmentData.patientDetails) {
                throw new Error('Invalid appointment data structure');
            }

            // Validate date and time
            if (!appointmentData.doctorDetails.date || !appointmentData.doctorDetails.time) {
                throw new Error('Appointment date and time are required');
            }

            // Format the date for display
            const appointmentDate = new Date(appointmentData.doctorDetails.date);
            if (isNaN(appointmentDate.getTime())) {
                throw new Error('Invalid appointment date format');
            }
            const formattedDate = appointmentDate.toLocaleDateString();

            setAppointmentDetails({
                doctor: {
                    _id: appointmentData.doctorDetails._id,
                    name: appointmentData.doctorDetails.name,
                    specialty: appointmentData.doctorDetails.specialty,
                    fee: appointmentData.doctorDetails.fee,
                    date: formattedDate,
                    time: appointmentData.doctorDetails.time
                },
                patient: appointmentData.patientDetails.name,
                reference: `APT${Date.now().toString().slice(-6)}`
            });
        } catch (error) {
            console.error('Error parsing appointment details:', error);
            toast.error(error.message || "Error loading appointment details");
            navigate('/doc');
        }
    }, [navigate]);

    const createAppointment = async () => {
        try {
            const pendingAppointment = JSON.parse(sessionStorage.getItem('pendingAppointment'));
            const userData = JSON.parse(localStorage.getItem('user'));

            if (!userData || !userData._id) {
                throw new Error('User data not found');
            }

            // Format the date to match the API format (YYYY-MM-DD)
            const appointmentDate = new Date(pendingAppointment.doctorDetails.date);
            const formattedDate = appointmentDate.toISOString().split('T')[0];

            const appointmentData = {
                doctorId: pendingAppointment.doctorDetails._id,
                patientId: userData._id,
                date: formattedDate,
                time: pendingAppointment.doctorDetails.time,
                reason: pendingAppointment.doctorDetails.reason || "General Consultation",
                name: pendingAppointment.patientDetails.name,
                email: pendingAppointment.patientDetails.email,
                phone: pendingAppointment.patientDetails.phone,
                patientLocation: pendingAppointment.patientDetails.location,
                reference: `APT${Date.now().toString().slice(-6)}`,
                paymentStatus: 'completed',
                status: 'pending'
            };

            console.log('Creating appointment with data:', appointmentData);

            const response = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            const data = await response.json();
            console.log('Appointment creation response:', data);

            if (!data.success) {
                throw new Error(data.error || 'Failed to create appointment');
            }

            // Clear the pending appointment data
            sessionStorage.removeItem('pendingAppointment');
            return true;
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error(error.message || 'Failed to create appointment');
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
        if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
            toast.error("Please fill in all payment details");
            return;
        }

        // Validate card number length (must be exactly 16 digits)
        const numericCardNumber = cardNumber.replace(/\s+/g, "");
        if (numericCardNumber.length !== 16) {
            toast.error("Card number must be 16 digits");
            return;
        }

        setIsProcessing(true);

        try {
            // Set reference number for the receipt
            const referenceNumber = `APT${Date.now().toString().slice(-6)}`;
            setReference(referenceNumber);

            // Get user data from localStorage
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData._id) {
                throw new Error('User data not found. Please log in again.');
            }

            // Get appointment details from sessionStorage
            const pendingAppointment = JSON.parse(sessionStorage.getItem('pendingAppointment'));
            if (!pendingAppointment || !pendingAppointment.doctorDetails) {
                throw new Error('Appointment details not found. Please try booking again.');
            }

            // Validate required fields
            if (!pendingAppointment.doctorDetails.date || !pendingAppointment.doctorDetails.time) {
                throw new Error('Appointment date and time are required.');
            }

            // Format the date to match the API format (YYYY-MM-DD)
            const appointmentDate = new Date(pendingAppointment.doctorDetails.date);
            if (isNaN(appointmentDate.getTime())) {
                throw new Error('Invalid appointment date format.');
            }
            const formattedDate = appointmentDate.toISOString().split('T')[0];

            // Create appointment data with all required fields
            const appointmentData = {
                doctorId: pendingAppointment.doctorDetails._id,
                patientId: userData._id,
                date: formattedDate,
                time: pendingAppointment.doctorDetails.time,
                reason: pendingAppointment.doctorDetails.reason || "General Consultation",
                name: pendingAppointment.patientDetails.name,
                email: pendingAppointment.patientDetails.email,
                phone: pendingAppointment.patientDetails.phone,
                patientLocation: pendingAppointment.patientDetails.location,
                reference: referenceNumber,
                paymentStatus: "pending", // Will be updated after payment processing
                status: "pending"
            };

            // Validate all required fields
            const requiredFields = ['doctorId', 'patientId', 'date', 'time', 'reason', 'name', 'email', 'phone', 'reference', 'patientLocation'];
            const missingFields = requiredFields.filter(field => !appointmentData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            console.log('Creating appointment with data:', appointmentData);

            // Step 1: Create appointment in database
            const appointmentResponse = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            const appointmentResult = await appointmentResponse.json();
            console.log('Appointment creation response:', appointmentResult);

            if (!appointmentResult.success) {
                throw new Error(appointmentResult.error || 'Failed to create appointment');
            }

            // Step 2: Process payment with hashed card details
            const paymentData = {
                appointmentId: appointmentResult.data._id,
                patientId: userData._id,
                amount: pendingAppointment.doctorDetails.fee + 150, // Fee + service charge
                reference: referenceNumber,
                paymentMethod: 'card',
                cardNumber: numericCardNumber,
                cardHolder: cardName,
                expiryMonth,
                expiryYear
            };

            console.log('Processing payment for appointment:', appointmentResult.data._id);

            const paymentResponse = await fetch('http://localhost:5000/api/payments/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            const paymentResult = await paymentResponse.json();
            console.log('Payment processing response:', paymentResult);

            if (!paymentResult.success) {
                throw new Error(paymentResult.error || 'Failed to process payment');
            }

            // Show success message and update UI
            setPaymentSuccess(true);
            toast.success("Payment successful!");

            // Clear the pending appointment data
            sessionStorage.removeItem('pendingAppointment');
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error.message || "Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCardNumber = (value) => {
        // First, strip any non-numeric characters
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

        // Limit to 16 digits
        const limitedValue = v.slice(0, 16);

        const parts = [];

        // Format into groups of 4 digits
        for (let i = 0, len = limitedValue.length; i < len; i += 4) {
            parts.push(limitedValue.substring(i, i + 4));
        }

        // Return formatted card number or just the cleaned value if no matches
        return parts.length ? parts.join(" ") : limitedValue;
    };

    // Generate array of months (01-12)
    const months = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return month < 10 ? `0${month}` : `${month}`;
    });

    // Generate array of years (current year to current year + 10)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => (currentYear + i).toString().slice(-2));

    if (!appointmentDetails) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-gray-800/50 border-b border-gray-700 p-4">
                <div className="container mx-auto flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-blue-400 hover:text-blue-300 mr-4"
                    >
                        <FiArrowLeft className="mr-2" /> Back
                    </button>
                    <h1 className="text-2xl font-bold">Payment Portal</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto p-4 md:p-8">
                {paymentSuccess ? (
                    <div className="max-w-2xl mx-auto bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                        <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                        <p className="text-gray-300 mb-6">Your appointment has been confirmed.</p>

                        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 mb-6 text-left">
                            <h3 className="font-bold text-lg mb-4">Appointment Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Doctor:</span>
                                    <span>{appointmentDetails.doctor.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Specialty:</span>
                                    <span>{appointmentDetails.doctor.specialty}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Date & Time:</span>
                                    <span>{appointmentDetails.doctor.date} at {appointmentDetails.doctor.time}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Amount Paid:</span>
                                    <span className="font-bold">LKR {appointmentDetails.doctor.fee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Reference:</span>
                                    <span>{reference}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/myapp")}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                        >
                            View My Appointments
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Payment Summary */}
                        <div className="md:w-1/3 bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-fit">
                            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Consultation Fee:</span>
                                    <span>LKR {appointmentDetails.doctor.fee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Service Charge:</span>
                                    <span>LKR 150.00</span>
                                </div>
                                <div className="pt-4 border-t border-gray-700">
                                    <div className="flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span>LKR {(appointmentDetails.doctor.fee + 150).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                                <div className="flex items-start text-sm text-blue-300">
                                    <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                    <p>Your appointment will only be confirmed after successful payment.</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="md:w-2/3 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">Payment Method</h2>

                            <div className="flex space-x-4 mb-6">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 px-4 rounded-lg border ${paymentMethod === "card" ? "border-blue-500 bg-blue-900/20" : "border-gray-700"}`}
                                    onClick={() => setPaymentMethod("card")}
                                >
                                    Credit/Debit Card
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 px-4 rounded-lg border ${paymentMethod === "paypal" ? "border-blue-500 bg-blue-900/20" : "border-gray-700"}`}
                                    onClick={() => setPaymentMethod("paypal")}
                                >
                                    PayPal
                                </button>
                            </div>

                            {paymentMethod === "card" ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-300 mb-2">Card Number</label>
                                            <div className="relative">
                                                <FiCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    className={`w-full bg-gray-800 border ${
                                                        cardNumber && cardNumber.replace(/\s+/g, "").length < 16
                                                        ? "border-red-500"
                                                        : "border-gray-700"
                                                    } rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                    placeholder="1234 5678 9012 3456"
                                                    value={formatCardNumber(cardNumber)}
                                                    onChange={(e) => {
                                                        // Only allow numbers (the formatCardNumber function will handle spacing)
                                                        const value = e.target.value;
                                                        // Strip any non-numeric characters before passing to formatCardNumber
                                                        const numericValue = value.replace(/[^\d\s]/g, '');
                                                        if (numericValue !== value) {
                                                            // If non-numeric characters were removed, update with cleaned value
                                                            e.target.value = numericValue;
                                                        }
                                                        setCardNumber(numericValue);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Allow: special keys (backspace, delete, arrows, etc.)
                                                        const specialKeys = [
                                                            'Backspace', 'Tab', 'Enter', 'Escape', 'Delete',
                                                            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                                                            'Home', 'End'
                                                        ];

                                                        if (specialKeys.includes(e.key)) {
                                                            return;
                                                        }

                                                        // Block non-numeric characters
                                                        if (!/^[0-9]$/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    maxLength={19}
                                                    required
                                                />
                                                {cardNumber && cardNumber.replace(/\s+/g, "").length < 16 && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        Card number must be 16 digits
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 mb-2">Cardholder Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="John Doe"
                                                value={cardName}
                                                onChange={(e) => {
                                                    // Only allow letters and spaces
                                                    const value = e.target.value;
                                                    if (/^[A-Za-z\s]*$/.test(value) || value === '') {
                                                        setCardName(value);
                                                    }
                                                }}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-300 mb-2">Expiry Date</label>
                                                <div className="flex space-x-2">
                                                    <div className="relative flex-1">
                                                        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                        <select
                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                            value={expiryMonth}
                                                            onChange={(e) => setExpiryMonth(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Month</option>
                                                            {months.map((month) => (
                                                                <option key={month} value={month}>
                                                                    {month}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <select
                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                            value={expiryYear}
                                                            onChange={(e) => setExpiryYear(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Year</option>
                                                            {years.map((year) => (
                                                                <option key={year} value={year}>
                                                                    20{year}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 mb-2">  CVV</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="123"
                                                    value={cvv}
                                                    onChange={(e) => {
                                                        // Only allow numbers and limit to 3 digits
                                                        const value = e.target.value;
                                                        if (/^\d*$/.test(value) && value.length <= 3) {
                                                            setCvv(value);
                                                        }
                                                    }}
                                                    maxLength={3}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <FiLoader className="animate-spin mr-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                `Pay LKR ${(appointmentDetails.doctor.fee + 150).toLocaleString()}`
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">PayPal integration coming soon...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}