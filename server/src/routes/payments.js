const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   POST /api/payments/deposit
// @desc    Create a deposit transaction
// @access  Private
router.post('/deposit', async (req, res) => {
  try {
    const { amount, paymentMethod = 'stripe' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      description: `Deposit of $${amount}`,
      paymentMethod,
      status: 'pending'
    });

    if (paymentMethod === 'stripe') {
      try {
        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            userId: req.user.id,
            transactionId: transaction._id.toString(),
            type: 'deposit'
          }
        });

        transaction.paymentIntentId = paymentIntent.id;
      } catch (stripeError) {
        console.log('Stripe not configured properly, proceeding with demo mode');
        // For demo purposes, simulate successful payment
        transaction.status = 'completed';
        transaction.paymentIntentId = `demo_pi_${Date.now()}`;
      }
    } else {
      // For non-Stripe payments, mark as completed for demo
      transaction.status = 'completed';
    }

    await transaction.save();
    await transaction.populate('userId', 'name email');

    let clientSecret = null;
    if (paymentMethod === 'stripe' && transaction.paymentIntentId && !transaction.paymentIntentId.startsWith('demo_')) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(transaction.paymentIntentId);
        clientSecret = paymentIntent.client_secret;
      } catch (stripeError) {
        console.log('Could not retrieve Stripe payment intent, using demo mode');
      }
    }

    res.status(201).json({
      success: true,
      message: 'Deposit transaction created',
      transaction,
      clientSecret
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during deposit'
    });
  }
});

// @route   POST /api/payments/withdraw
// @desc    Create a withdrawal transaction
// @access  Private
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, paymentMethod = 'stripe' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // In a real app, you'd check user's balance here
    // For now, we'll create the transaction as pending

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'withdraw',
      amount: parseFloat(amount),
      description: `Withdrawal of $${amount}`,
      paymentMethod,
      status: 'pending'
    });

    await transaction.save();
    await transaction.populate('userId', 'name email');

    // In sandbox mode, we'll simulate processing
    setTimeout(async () => {
      try {
        transaction.status = 'completed';
        transaction.processedAt = new Date();
        await transaction.save();
      } catch (err) {
        console.error('Error updating withdrawal:', err);
      }
    }, 3000); // Simulate 3 second processing

    res.status(201).json({
      success: true,
      message: 'Withdrawal transaction created',
      transaction
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during withdrawal'
    });
  }
});

// @route   POST /api/payments/transfer
// @desc    Create a transfer transaction between users
// @access  Private
router.post('/transfer', async (req, res) => {
  try {
    const { amount, recipientId, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Create transfer transaction
    const transaction = new Transaction({
      userId: req.user.id,
      recipientId,
      type: 'transfer',
      amount: parseFloat(amount),
      description: description || `Transfer to ${recipient.name}`,
      paymentMethod: 'bank_transfer',
      status: 'pending'
    });

    await transaction.save();
    await transaction.populate('userId', 'name email');
    await transaction.populate('recipientId', 'name email');

    // In sandbox mode, simulate processing
    setTimeout(async () => {
      try {
        transaction.status = 'completed';
        transaction.processedAt = new Date();
        await transaction.save();
      } catch (err) {
        console.error('Error updating transfer:', err);
      }
    }, 2000); // Simulate 2 second processing

    res.status(201).json({
      success: true,
      message: 'Transfer transaction created',
      transaction
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transfer'
    });
  }
});

// @route   GET /api/payments/transactions
// @desc    Get user's transaction history
// @access  Private
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const query = {
      $or: [
        { userId: req.user.id },
        { recipientId: req.user.id }
      ]
    };

    // Add filters
    if (type && type !== 'all') {
      query.type = type;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   GET /api/payments/transactions/:id
// @desc    Get specific transaction details
// @access  Private
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('recipientId', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user has access to this transaction
    const hasAccess = 
      transaction.userId._id.toString() === req.user.id ||
      (transaction.recipientId && transaction.recipientId._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   POST /api/payments/webhook/stripe
// @desc    Handle Stripe webhook events
// @access  Public (but verified)
router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update transaction status
      try {
        const transaction = await Transaction.findOne({ 
          paymentIntentId: paymentIntent.id 
        });
        
        if (transaction) {
          transaction.status = 'completed';
          transaction.processedAt = new Date();
          await transaction.save();
        }
      } catch (err) {
        console.error('Error updating transaction:', err);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      try {
        const transaction = await Transaction.findOne({ 
          paymentIntentId: failedPayment.id 
        });
        
        if (transaction) {
          transaction.status = 'failed';
          transaction.errorMessage = failedPayment.last_payment_error?.message || 'Payment failed';
          await transaction.save();
        }
      } catch (err) {
        console.error('Error updating failed transaction:', err);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

module.exports = router;