import mongoose from 'mongoose';
import crypto from 'crypto';

const paymentSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['completed', 'failed', 'refunded'],
        default: 'completed'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal'],
        default: 'card'
    },
    // Hashed payment details
    cardNumberHash: {
        type: String,
        required: function() {
            return this.paymentMethod === 'card';
        }
    },
    cardHolderHash: {
        type: String,
        required: function() {
            return this.paymentMethod === 'card';
        }
    },
    // Store only last 4 digits of card (not hashed for display purposes)
    cardLastFour: {
        type: String,
        required: function() {
            return this.paymentMethod === 'card';
        }
    },
    // Store card type/brand if detected
    cardType: {
        type: String
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Static method to hash sensitive data
paymentSchema.statics.hashData = function(data) {
    // Use SHA-256 for hashing
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Static method to create a payment record with hashed card details
paymentSchema.statics.createWithHashedDetails = async function(paymentData) {
    const { cardNumber, cardHolder, ...otherData } = paymentData;
    
    // Hash sensitive data
    const cardNumberHash = this.hashData(cardNumber);
    const cardHolderHash = this.hashData(cardHolder);
    
    // Extract last 4 digits for reference
    const cardLastFour = cardNumber.slice(-4);
    
    // Detect card type (simplified version)
    let cardType = 'Unknown';
    if (cardNumber.startsWith('4')) {
        cardType = 'Visa';
    } else if (cardNumber.startsWith('5')) {
        cardType = 'MasterCard';
    } else if (cardNumber.startsWith('3')) {
        cardType = 'American Express';
    } else if (cardNumber.startsWith('6')) {
        cardType = 'Discover';
    }
    
    // Create and return the payment record
    return await this.create({
        ...otherData,
        cardNumberHash,
        cardHolderHash,
        cardLastFour,
        cardType
    });
};

// Method to verify if a card number matches the stored hash
paymentSchema.methods.verifyCardNumber = function(cardNumber) {
    const hash = crypto.createHash('sha256').update(cardNumber).digest('hex');
    return hash === this.cardNumberHash;
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
