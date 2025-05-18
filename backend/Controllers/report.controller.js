const PDFDocument = require('pdfkit');
const Appointment = require('../Models/appointment.model');
const Doctor = require('../Models/doctor.model');

// Helper function to get date range based on period
const getDateRange = (period) => {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate = new Date(0); // All time
    }
    
    return { startDate, endDate: now };
};

// Generate income report
exports.generateIncomeReport = async (req, res) => {
    try {
        const { period } = req.query;
        const { startDate, endDate } = getDateRange(period);
        
        // Get doctor's appointments within the date range
        const appointments = await Appointment.find({
            doctorId: req.user.doctorId,
            date: { $gte: startDate, $lte: endDate },
            paymentStatus: 'completed'
        }).populate('patientId', 'username');
        
        // Calculate total income
        const totalIncome = appointments.reduce((sum, appointment) => sum + appointment.amount, 0);
        
        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=income-report-${period || 'all'}.pdf`);
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text('Income Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${period ? period.charAt(0).toUpperCase() + period.slice(1) : 'All Time'}`);
        doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(16).text(`Total Income: $${totalIncome.toFixed(2)}`);
        doc.moveDown();
        
        // Add appointments table
        doc.fontSize(14).text('Appointments', { underline: true });
        doc.moveDown();
        
        // Table headers
        doc.fontSize(10);
        doc.text('Date', 50, doc.y, { width: 100 });
        doc.text('Patient', 150, doc.y - 10, { width: 150 });
        doc.text('Amount', 300, doc.y - 10, { width: 100 });
        
        // Table rows
        appointments.forEach(appointment => {
            doc.moveDown();
            doc.text(new Date(appointment.date).toLocaleDateString(), 50, doc.y, { width: 100 });
            doc.text(appointment.patientId.username, 150, doc.y - 10, { width: 150 });
            doc.text(`$${appointment.amount.toFixed(2)}`, 300, doc.y - 10, { width: 100 });
        });
        
        doc.end();
    } catch (error) {
        console.error('Error generating income report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate income report' });
    }
};

// Generate appointments report
exports.generateAppointmentsReport = async (req, res) => {
    try {
        const { period } = req.query;
        const { startDate, endDate } = getDateRange(period);
        
        // Get doctor's appointments within the date range
        const appointments = await Appointment.find({
            doctorId: req.user.doctorId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('patientId', 'username');
        
        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=appointments-report-${period || 'all'}.pdf`);
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text('Appointments Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${period ? period.charAt(0).toUpperCase() + period.slice(1) : 'All Time'}`);
        doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        doc.moveDown();
        
        // Add statistics
        const totalAppointments = appointments.length;
        const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
        const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
        const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
        
        doc.fontSize(14).text('Statistics', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Appointments: ${totalAppointments}`);
        doc.text(`Confirmed: ${confirmedAppointments}`);
        doc.text(`Pending: ${pendingAppointments}`);
        doc.text(`Cancelled: ${cancelledAppointments}`);
        doc.moveDown();
        
        // Add appointments table
        doc.fontSize(14).text('Appointments', { underline: true });
        doc.moveDown();
        
        // Table headers
        doc.fontSize(10);
        doc.text('Date', 50, doc.y, { width: 100 });
        doc.text('Patient', 150, doc.y - 10, { width: 150 });
        doc.text('Status', 300, doc.y - 10, { width: 100 });
        
        // Table rows
        appointments.forEach(appointment => {
            doc.moveDown();
            doc.text(new Date(appointment.date).toLocaleDateString(), 50, doc.y, { width: 100 });
            doc.text(appointment.patientId.username, 150, doc.y - 10, { width: 150 });
            doc.text(appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1), 300, doc.y - 10, { width: 100 });
        });
        
        doc.end();
    } catch (error) {
        console.error('Error generating appointments report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate appointments report' });
    }
}; 