import express from 'express';
import Appointment from '../Models/appointment.model.js';
import Payment from '../Models/payment.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Process refund request
router.post('/refund', async (req, res) => {
    try {
        const { appointmentId, reference } = req.body;

        // Validate required fields
        if (!appointmentId && !reference) {
            return res.status(400).json({
                success: false,
                error: 'Either appointmentId or reference is required'
            });
        }

        // Find the appointment
        let appointment;
        if (appointmentId) {
            appointment = await Appointment.findById(appointmentId);
        } else if (reference) {
            appointment = await Appointment.findOne({ reference });
        }

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Check if appointment is eligible for refund
        // Only pending appointments can be refunded
        if (appointment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending appointments can be refunded'
            });
        }

        // Find the payment record
        const payment = await Payment.findOne({
            appointmentId: appointment._id
        });

        // Update payment status if found
        if (payment) {
            payment.status = 'refunded';
            await payment.save();
        }

        // Update appointment payment status
        appointment.paymentStatus = 'refunded';

        // Add a flag to the appointment indicating it was refunded
        if (!appointment.flags) {
            appointment.flags = [];
        }

        appointment.flags.push({
            type: 'info',
            message: 'Refund processed',
            createdAt: new Date(),
        });

        // Save the updated appointment
        await appointment.save();

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                appointmentId: appointment._id,
                reference: appointment.reference,
                status: appointment.status,
                paymentStatus: appointment.paymentStatus
            }
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing refund'
        });
    }
});

// Get payment history for a user
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all payments for the user
        const payments = await Payment.find({ patientId: userId })
            .sort({ createdAt: -1 });

        // Get appointment details for each payment
        const paymentHistory = await Promise.all(
            payments.map(async (payment) => {
                const appointment = await Appointment.findById(payment.appointmentId)
                    .populate('doctorId', 'name specialization hospital');

                return {
                    paymentId: payment._id,
                    reference: payment.reference,
                    amount: payment.amount,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    cardLastFour: payment.cardLastFour,
                    cardType: payment.cardType,
                    createdAt: payment.createdAt,
                    appointment: appointment ? {
                        id: appointment._id,
                        doctor: appointment.doctorId,
                        date: appointment.date,
                        time: appointment.time,
                        status: appointment.status
                    } : null
                };
            })
        );

        res.json({
            success: true,
            data: paymentHistory
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error fetching payment history'
        });
    }
});

// Process payment
router.post('/process', async (req, res) => {
    try {
        const {
            appointmentId,
            patientId,
            amount,
            reference,
            paymentMethod,
            cardNumber,
            cardHolder,
            expiryMonth,
            expiryYear
        } = req.body;

        // Validate required fields
        if (!appointmentId || !patientId || !amount || !reference) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment information'
            });
        }

        // Validate card details for card payments
        if (paymentMethod === 'card') {
            if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required card information'
                });
            }

            // Validate card number format (16 digits)
            const numericCardNumber = cardNumber.replace(/\s+/g, '');
            if (numericCardNumber.length !== 16 || !/^\d+$/.test(numericCardNumber)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid card number format'
                });
            }
        }

        // Find the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Create payment record with hashed details
        const payment = await Payment.createWithHashedDetails({
            appointmentId,
            patientId,
            amount,
            reference,
            paymentMethod,
            cardNumber: cardNumber.replace(/\s+/g, ''),
            cardHolder
        });

        // Update appointment payment status
        appointment.paymentStatus = 'completed';
        await appointment.save();

        // Return success response (without sensitive data)
        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                reference: payment.reference,
                amount: payment.amount,
                status: payment.status,
                cardLastFour: payment.cardLastFour,
                cardType: payment.cardType,
                createdAt: payment.createdAt
            }
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing payment'
        });
    }
});

export default router;
