const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { validatePhone, normalizePhone } = require('../utils/validation');

router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });

    const customers = await Customer.find({ OwnerId: ownerId });

    const customersWithAging = await Promise.all(customers.map(async (customer) => {
      const oldestTransaction = await Transaction.findOne({ customerId: customer._id, type: 'GAVE', status: 'PARTIAL' }).sort({ date: 1 });
      let agingDays = 0;
      if (oldestTransaction) {
        agingDays = Math.floor((new Date() - new Date(oldestTransaction.date)) / (1000 * 60 * 60 * 24));
      }
      return { ...customer.toObject(), agingDays };
    }));

    res.json(customersWithAging);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-debts/:phone', async (req, res) => {
  try {
    if (!validatePhone(req.params.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }
    const normalizedPhone = normalizePhone(req.params.phone);
    
    const debts = await Customer.find({ Phone: normalizedPhone }).populate('OwnerId', 'Name Shop_Name Phone');
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/:phone', async (req, res) => {
  try {
    if (!validatePhone(req.params.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }
    const normalizedPhone = normalizePhone(req.params.phone);
    
    const user = await User.findOne({ Phone: normalizedPhone, Role: 'Customer' }).select('-Password');
    if (!user) {
      return res.status(404).json({ message: 'No registered customer found by this phone number.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Name, Phone, Current_Balance, Credit_Limit, Repayment_Cycle, OwnerId } = req.body;
    
    if (!validatePhone(Phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }
    const normalizedPhone = normalizePhone(Phone);

    const owner = await User.findById(OwnerId);
    if (!owner) {
      return res.status(404).json({ error: 'Shop owner not found.' });
    }
    if (owner.Phone === normalizedPhone) {
      return res.status(400).json({ error: "This is yourself, you can't do this." });
    }

    const existingRelation = await Customer.findOne({ OwnerId, Phone: normalizedPhone });
    if (existingRelation) {
      return res.status(400).json({ error: 'This customer is already in your ledger.' });
    }

    const registeredUser = await User.findOne({ Phone: normalizedPhone, Role: 'Customer' });

    const customer = new Customer({
      Name, 
      Phone: normalizedPhone,
      Current_Balance: Current_Balance || 0,
      Credit_Limit: Credit_Limit || 0,
      Repayment_Cycle: Repayment_Cycle || 'FLEXIBLE',
      OwnerId,
      Is_Registered: !!registeredUser,
      Registered_UserId: registeredUser ? registeredUser._id : null
    });
    
    await customer.save();

    if (customer.Current_Balance > 0) {
      const { calculateDueDate } = require('../utils/repayment');
      const dueDate = calculateDueDate(new Date(), customer.Repayment_Cycle);
      const transaction = new Transaction({
        customerId: customer._id,
        type: 'GAVE',
        amount: customer.Current_Balance,
        description: 'Initial Debt',
        date: new Date(),
        dueDate,
        status: 'PARTIAL'
      });
      await transaction.save();

      if (dueDate) {
        customer.Next_Due_Date = dueDate;
        await customer.save();
      }
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { Name, Phone, Credit_Limit, Repayment_Cycle } = req.body;
    const updateData = {};
    if (Name !== undefined) updateData.Name = Name;
    if (Phone !== undefined) updateData.Phone = Phone;
    if (Credit_Limit !== undefined) updateData.Credit_Limit = Credit_Limit;
    if (Repayment_Cycle !== undefined) updateData.Repayment_Cycle = Repayment_Cycle;

    const customer = await Customer.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!customer) return res.status(404).json({ error: 'Not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });
    await Transaction.deleteMany({ customerId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
