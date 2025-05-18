import { useState, useEffect } from 'react';
import { FiFilter, FiCalendar, FiDollarSign, FiCheckCircle, FiClock, FiXCircle, FiChevronLeft, FiChevronRight, FiFlag, FiX, FiPlus, FiDownload } from 'react-icons/fi';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        totalAmount: 0,
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        paymentStatus: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [newFlag, setNewFlag] = useState({
        type: 'info',
        message: ''
    });
    const [showReportModal, setShowReportModal] = useState(false);
    const [doctorId, setDoctorId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/appointments/transactions`);
                const data = await response.json();
                
                if (data.success) {
                    const filteredTransactions = filterTransactions(data.data.transactions, filters);
                    setTransactions(filteredTransactions);
                    setSummary(data.data.summary);
                } else {
                    toast.error(data.error || 'Failed to fetch transactions');
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
                toast.error('Failed to fetch transactions');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Get doctor data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log('User data from localStorage:', userData);
        
        if (userData && userData._id) {
            setDoctorId(userData._id);
            console.log('Doctor ID set:', userData._id);
        } else {
            console.error('No user data found in localStorage');
            toast.error('Please log in to access this feature');
        }
    }, [filters]);

    const filterTransactions = (transactions, filters) => {
        return transactions.filter(transaction => {
            // Filter by date range
            if (filters.startDate || filters.endDate) {
                const transactionDate = new Date(transaction.date);
                const startDate = filters.startDate ? new Date(filters.startDate) : null;
                const endDate = filters.endDate ? new Date(filters.endDate) : null;

                if (startDate && transactionDate < startDate) return false;
                if (endDate && transactionDate > endDate) return false;
            }

            // Filter by payment status
            if (filters.paymentStatus && transaction.paymentStatus !== filters.paymentStatus) {
                return false;
            }

            return true;
        });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'MMM dd, yyyy');
    };

    const formatTime = (timeString) => {
        return timeString;
    };

    const formatAmount = (amount) => {
        return `LKR ${amount.toLocaleString()}`;
    };

    const handleAddFlag = async () => {
        try {
            if (!selectedTransaction) {
                toast.error('No transaction selected');
                return;
            }

            if (!newFlag.message.trim()) {
                toast.error('Please enter a flag message');
                return;
            }

            // Get user data from localStorage
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData._id) {
                toast.error('User data not found');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/appointments/${selectedTransaction._id}/flags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: newFlag.type,
                    message: newFlag.message,
                    userId: userData._id
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Flag added successfully');
                setShowFlagModal(false);
                setNewFlag({ type: 'info', message: '' });
                fetchTransactions(); // Refresh the transactions list
            } else {
                throw new Error(data.error || 'Failed to add flag');
            }
        } catch (error) {
            console.error('Error adding flag:', error);
            toast.error(error.message || 'Failed to add flag');
        }
    };

    const handleRemoveFlag = async (transactionId, flagId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${transactionId}/flags/${flagId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Flag removed successfully');
                fetchTransactions(); // Refresh the transactions list
            } else {
                throw new Error(data.error || 'Failed to remove flag');
            }
        } catch (error) {
            console.error('Error removing flag:', error);
            toast.error(error.message || 'Failed to remove flag');
        }
    };

    const openFlagModal = (transaction) => {
        setSelectedTransaction(transaction);
        setShowFlagModal(true);
    };

    const getFlagColor = (type) => {
        switch (type) {
            case 'warning':
                return 'bg-amber-900/50 text-amber-300';
            case 'error':
                return 'bg-red-900/50 text-red-300';
            case 'success':
                return 'bg-green-900/50 text-green-300';
            case 'info':
            default:
                return 'bg-blue-900/50 text-blue-300';
        }
    };

    const handleDownloadReport = async () => {
        try {
            if (!doctorId) {
                console.log('Error: Doctor ID not found in state');
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData && userData._id) {
                    setDoctorId(userData._id);
                    console.log('Doctor ID retrieved from localStorage:', userData._id);
                } else {
                    toast.error('Please log in to download reports');
                    return;
                }
            }

            // Ensure we have transactions data
            if (!transactions || transactions.length === 0) {
                toast.error('No transactions data available');
                return;
            }

            // Create a temporary div with fixed dimensions
            const tempDiv = document.createElement('div');
            tempDiv.style.width = '800px';
            tempDiv.style.height = 'auto';
            tempDiv.style.padding = '20px';
            tempDiv.style.position = 'fixed';
            tempDiv.style.left = '0';
            tempDiv.style.top = '0';
            tempDiv.style.backgroundColor = 'white';
            tempDiv.style.zIndex = '9999';
            
            // Create table with fixed width
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.border = '1px solid black';
            table.style.borderCollapse = 'collapse';
            table.style.fontSize = '12px';
            table.style.color = 'black';
            
            // Create header row
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Date', 'Reference', 'Patient', 'Doctor', 'Amount', 'Status'].forEach(header => {
                const th = document.createElement('th');
                th.style.border = '1px solid black';
                th.style.padding = '8px';
                th.style.textAlign = 'left';
                th.style.color = 'black';
                th.style.fontWeight = 'bold';
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                [
                    formatDate(transaction.date),
                    transaction.reference,
                    transaction.patientId?.username || transaction.name,
                    `Dr. ${transaction.doctorId?.name}`,
                    `LKR ${transaction.amount.toLocaleString()}`,
                    transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)
                ].forEach(cellData => {
                    const td = document.createElement('td');
                    td.style.border = '1px solid black';
                    td.style.padding = '8px';
                    td.style.color = 'black';
                    td.textContent = cellData;
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            
            // Add title
            const title = document.createElement('h2');
            title.textContent = 'Transactions Report';
            title.style.textAlign = 'center';
            title.style.marginBottom = '20px';
            title.style.fontSize = '16px';
            title.style.fontWeight = 'bold';
            title.style.color = 'black';
            
            // Add date range if filters are set
            if (filters.startDate || filters.endDate) {
                const dateRange = document.createElement('p');
                dateRange.textContent = `Date Range: ${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`;
                dateRange.style.textAlign = 'center';
                dateRange.style.marginBottom = '20px';
                dateRange.style.fontSize = '14px';
                dateRange.style.color = 'black';
                tempDiv.appendChild(dateRange);
            }
            
            tempDiv.appendChild(title);
            tempDiv.appendChild(table);
            document.body.appendChild(tempDiv);

            // Wait for the content to be fully rendered
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create canvas from content
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff'
            });

            // Remove the temporary div
            document.body.removeChild(tempDiv);

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add the image to the PDF
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

            // Save the PDF
            pdf.save(`transactions-report-${new Date().toISOString().split('T')[0]}.pdf`);

            console.log('PDF generated successfully');
            toast.success('Report downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error(error.message || 'Failed to generate PDF');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadReport}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <FiDownload />
                            Download Report
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <FiFilter />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Payment Status
                                </label>
                                <select
                                    name="paymentStatus"
                                    value={filters.paymentStatus}
                                    onChange={handleFilterChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-900/50 p-3 rounded-lg">
                                <FiDollarSign className="text-blue-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Amount</p>
                                <p className="text-xl font-bold">{formatAmount(summary.totalAmount)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-900/50 p-3 rounded-lg">
                                <FiCheckCircle className="text-green-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Completed</p>
                                <p className="text-xl font-bold">{summary.completedTransactions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-900/50 p-3 rounded-lg">
                                <FiClock className="text-amber-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Pending</p>
                                <p className="text-xl font-bold">{summary.pendingTransactions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-900/50 p-3 rounded-lg">
                                <FiXCircle className="text-red-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Failed</p>
                                <p className="text-xl font-bold">{summary.failedTransactions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channeling Trends Graph */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Channeling Trends</h2>
                    <div className="h-[300px]">
                        <Line
                            data={{
                                labels: transactions.map(t => format(new Date(t.date), 'MMM dd')),
                                datasets: [
                                    {
                                        label: 'Completed Appointments',
                                        data: transactions
                                            .filter(t => t.paymentStatus === 'completed')
                                            .map(t => t.amount),
                                        borderColor: 'rgb(34, 197, 94)',
                                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                                        tension: 0.4
                                    },
                                    {
                                        label: 'Pending Appointments',
                                        data: transactions
                                            .filter(t => t.paymentStatus === 'pending')
                                            .map(t => t.amount),
                                        borderColor: 'rgb(234, 179, 8)',
                                        backgroundColor: 'rgba(234, 179, 8, 0.5)',
                                        tension: 0.4
                                    },
                                    {
                                        label: 'Failed Appointments',
                                        data: transactions
                                            .filter(t => t.paymentStatus === 'failed')
                                            .map(t => t.amount),
                                        borderColor: 'rgb(239, 68, 68)',
                                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                                        tension: 0.4
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: 'rgb(156, 163, 175)'
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(75, 85, 99, 0.2)'
                                        },
                                        ticks: {
                                            color: 'rgb(156, 163, 175)',
                                            callback: function(value) {
                                                return 'LKR ' + value.toLocaleString();
                                            }
                                        }
                                    },
                                    x: {
                                        grid: {
                                            color: 'rgba(75, 85, 99, 0.2)'
                                        },
                                        ticks: {
                                            color: 'rgb(156, 163, 175)'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-700/50">
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Reference</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Patient</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Doctor</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Flags</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : transactions.length > 0 ? (
                                    transactions.map((transaction) => (
                                        <tr key={transaction._id} className="hover:bg-gray-700/30">
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div>{formatDate(transaction.date)}</div>
                                                    <div className="text-gray-400">{formatTime(transaction.time)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">{transaction.reference}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div>{transaction.patientId?.username || transaction.name}</div>
                                                    <div className="text-gray-400">{transaction.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div>Dr. {transaction.doctorId?.name}</div>
                                                    <div className="text-gray-400">{transaction.doctorId?.specialization}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                {formatAmount(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    transaction.paymentStatus === "completed" 
                                                        ? "bg-green-900/50 text-green-300" 
                                                        : transaction.paymentStatus === "pending"
                                                        ? "bg-amber-900/50 text-amber-300"
                                                        : "bg-red-900/50 text-red-300"
                                                }`}>
                                                    {transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {transaction.flags && transaction.flags.length > 0 ? (
                                                        transaction.flags.map((flag) => (
                                                            <div 
                                                                key={flag._id} 
                                                                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getFlagColor(flag.type)}`}
                                                            >
                                                                <span>{flag.message}</span>
                                                                <button 
                                                                    onClick={() => handleRemoveFlag(transaction._id, flag._id)}
                                                                    className="ml-1 hover:text-white"
                                                                >
                                                                    <FiX size={12} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <button
                                                            onClick={() => openFlagModal(transaction)}
                                                            className="text-gray-400 hover:text-white"
                                                        >
                                                            <FiFlag size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={filters.page === 1}
                            className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiChevronLeft />
                        </button>
                        <span className="text-sm">
                            Page {filters.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(filters.page + 1)}
                            disabled={filters.page === pagination.pages}
                            className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* Flag Modal */}
            {showFlagModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Flag</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Flag Type
                            </label>
                            <select
                                value={newFlag.type}
                                onChange={(e) => setNewFlag({...newFlag, type: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Message
                            </label>
                            <textarea
                                value={newFlag.message}
                                onChange={(e) => setNewFlag({...newFlag, message: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Enter flag message"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowFlagModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddFlag}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                                disabled={!newFlag.message.trim()}
                            >
                                Add Flag
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 