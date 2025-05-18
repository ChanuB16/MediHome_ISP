import express from 'express';
import PDFDocument from 'pdfkit';
import Appointment from '../Models/appointment.model.js';

const router = express.Router();

// Helper function to get date range based on period
const getDateRange = (period) => {
    const now = new Date();
    let startDate = new Date(now); // Clone current date
    
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

// Income report route
router.get('/income', async (req, res) => {
    try {
        const { period = 'month', doctorId } = req.query;
        
        console.log("Time period:", period);
        if (!doctorId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Doctor ID is required' 
            });
        }

        const { startDate, endDate } = getDateRange(period);

        console.log("Start date:", startDate.toISOString());
        console.log("End date:", endDate.toISOString());
        console.log("Date range in days:", Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
        
        // Get doctor's appointments within the date range
        const appointments = await Appointment.find({
            doctorId: doctorId,
            date: { $gte: startDate},
            paymentStatus: 'completed'
        })
        .populate('patientId', 'username')
        .populate('doctorId', 'name');
        
        console.log('Found appointments:', appointments.length);
        
        // Calculate total income using appointment amount
        const totalIncome = appointments.reduce((sum, appointment) => {
            return sum + (appointment.amount || 0);
        }, 0);
        
        console.log('Total income:', totalIncome);
        
        // Create PDF
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=income-report-${period}.pdf`);
        
        // Pipe the PDF document to the response
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text('Income Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`);
        doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(16).text(`Total Income: LKR ${totalIncome.toLocaleString()}`);
        doc.moveDown();
        
        // Add appointments table
        doc.fontSize(14).text('Appointments', { underline: true });
        doc.moveDown();
        
        // Table headers
        doc.fontSize(10);
        doc.text('Date', 50, doc.y, { width: 100 });
        doc.text('Patient', 150, doc.y - 10, { width: 150 });
        doc.text('Amount (LKR)', 300, doc.y - 10, { width: 100 });
        
        // Table rows
        appointments.forEach(appointment => {
            doc.moveDown();
            doc.text(new Date(appointment.date).toLocaleDateString(), 50, doc.y, { width: 100 });
            doc.text(appointment.patientId?.username || 'Unknown', 150, doc.y - 10, { width: 150 });
            doc.text((appointment.amount || 0).toLocaleString(), 300, doc.y - 10, { width: 100 });
        });
        
        // End the document and send the response
        doc.end();
    } catch (error) {
        console.error('Error generating income report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate income report' });
    }
});

// Appointments report route
router.get('/appointments', async (req, res) => {
    try {
        const { period, doctorId } = req.query;
        
        if (!doctorId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Doctor ID is required' 
            });
        }

        const { startDate, endDate } = getDateRange(period);
        
        // Get doctor's appointments within the date range
        const appointments = await Appointment.find({
            doctorId: doctorId,
            date: { $gte: startDate}
        }).populate('patientId', 'username');
        
        // Create PDF
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=appointments-report-${period || 'all'}.pdf`);
        
        // Pipe the PDF document to the response
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
            doc.text(appointment.patientId?.username || 'Unknown', 150, doc.y - 10, { width: 150 });
            doc.text(appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1), 300, doc.y - 10, { width: 100 });
        });
        
        // End the document and send the response
        doc.end();
    } catch (error) {
        console.error('Error generating appointments report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate appointments report' });
    }
});

// Transactions report route
router.get('/transactions', async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            paymentStatus,
            doctorId,
            patientId,
            period
        } = req.query;
        
        if (!doctorId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Doctor ID is required' 
            });
        }

        // Build query
        const query = { doctorId };
        
        // Date range filter
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate)
            };
        } else if (period) {
            // Use period if no specific dates provided
            const { startDate: periodStartDate, endDate: periodEndDate } = getDateRange(period);
            query.date = {
                $gte: periodStartDate
            };
        }

        // Payment status filter
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Patient filter
        if (patientId) {
            query.patientId = patientId;
        }

        // Fetch transactions with populated data
        const transactions = await Appointment.find(query)
            .populate('doctorId', 'name specialization hospital')
            .populate('patientId', 'username email')
            .sort({ date: -1, time: -1 });

        // Calculate total income from appointment amounts
        const totalIncome = transactions.reduce((sum, appointment) => {
            return sum + (appointment.amount || 0);
        }, 0);

        // Generate PDF report
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-report-${period || 'all'}.pdf`);
        
        // Pipe the PDF document to the response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('Transactions Report', { align: 'center' });
        doc.moveDown();
        
        // Add date range
        if (startDate && endDate) {
            doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
        } else if (period) {
            doc.fontSize(12).text(`Period: ${period}`);
        }
        doc.moveDown();

        // Add total income
        doc.fontSize(14).text(`Total Income: LKR ${totalIncome.toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Add transactions table
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidth = 100;
        const rowHeight = 30;

        // Table headers
        doc.fontSize(10)
           .text('Date', tableLeft, tableTop)
           .text('Patient', tableLeft + colWidth, tableTop)
           .text('Amount', tableLeft + colWidth * 2, tableTop)
           .text('Status', tableLeft + colWidth * 3, tableTop);

        // Table rows
        let y = tableTop + rowHeight;
        transactions.forEach(transaction => {
            doc.fontSize(10)
               .text(new Date(transaction.date).toLocaleDateString(), tableLeft, y)
               .text(transaction.patientId?.username || 'Unknown', tableLeft + colWidth, y)
               .text(`LKR ${transaction.amount.toLocaleString()}`, tableLeft + colWidth * 2, y)
               .text(transaction.paymentStatus, tableLeft + colWidth * 3, y);
            y += rowHeight;
        });

        // End the document and send the response
        doc.end();
    } catch (error) {
        console.error('Error generating transactions report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate transactions report' });
    }
});

export default router; 