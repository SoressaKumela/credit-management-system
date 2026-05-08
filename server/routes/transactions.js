const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { calculateDueDate, classifyPayment } = require('../utils/repayment');

router.post('/', async (req, res) => {
  try {
    const { customerId, type, amount, description, date } = req.body;
    const customer = await Customer.findById(customerId);

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const txDate = date || new Date();

    if (type === 'GAVE') {
      if (customer.Credit_Limit > 0 && customer.Current_Balance + amount > customer.Credit_Limit) {
        return res.status(400).json({
          error: `Credit limit exceeded. Limit: ${customer.Credit_Limit} ETB, Current: ${customer.Current_Balance} ETB, Requested: ${amount} ETB`
        });
      }

      const dueDate = calculateDueDate(txDate, customer.Repayment_Cycle);

      const transaction = new Transaction({
        customerId, type, amount, description,
        date: txDate,
        dueDate,
        status: 'PARTIAL'
      });
      await transaction.save();

      customer.Current_Balance += amount;
      if (dueDate && (!customer.Next_Due_Date || dueDate < customer.Next_Due_Date)) {
        customer.Next_Due_Date = dueDate;
      }
      await customer.save();

      return res.json(transaction);
    }

    if (type === 'GOT') {
      const classification = classifyPayment(txDate, customer.Next_Due_Date);

      const transaction = new Transaction({
        customerId, type, amount, description,
        date: txDate,
        paymentClassification: classification
      });
      await transaction.save();

      customer.Current_Balance -= amount;

      if (customer.Current_Balance <= 0) {
        await Transaction.updateMany(
          { customerId, type: 'GAVE', status: 'PARTIAL' },
          { status: 'SETTLED' }
        );
        customer.Current_Balance = 0;
        customer.Next_Due_Date = null;
      } else {
        const nextPartial = await Transaction.findOne(
          { customerId, type: 'GAVE', status: 'PARTIAL', dueDate: { $ne: null } }
        ).sort({ dueDate: 1 });
        customer.Next_Due_Date = nextPartial ? nextPartial.dueDate : null;
      }

      await customer.save();
      return res.json(transaction);
    }

    return res.status(400).json({ error: 'Invalid transaction type' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settle-all', async (req, res) => {
  try {
    const { customerId } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (customer.Current_Balance <= 0) return res.status(400).json({ error: 'No outstanding balance' });

    const settleAmount = customer.Current_Balance;

    const transaction = new Transaction({
      customerId,
      type: 'GOT',
      amount: settleAmount,
      description: 'Full settlement (lump sum)',
      date: new Date(),
      paymentClassification: classifyPayment(new Date(), customer.Next_Due_Date)
    });
    await transaction.save();

    await Transaction.updateMany(
      { customerId, type: 'GAVE', status: 'PARTIAL' },
      { status: 'SETTLED' }
    );

    customer.Current_Balance = 0;
    customer.Next_Due_Date = null;
    await customer.save();

    res.json({ success: true, transaction, settledAmount: settleAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:customerId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ customerId: req.params.customerId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
