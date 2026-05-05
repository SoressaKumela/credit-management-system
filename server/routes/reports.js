const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

router.get('/aging', async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });

    const customers = await Customer.find({ OwnerId: ownerId });
    
    const report = {
      '45_plus_days': [],
      '30_days': [],
      '15_days': [],
      'others': []
    };

    for (const customer of customers) {
      const oldestGave = await Transaction.findOne({ customerId: customer._id, type: 'GAVE' }).sort({ date: 1 });
      let days = 0;
      if (oldestGave) {
        days = Math.floor((new Date() - new Date(oldestGave.date)) / (1000 * 60 * 60 * 24));
        if (days >= 45) report['45_plus_days'].push({ customer, days });
        else if (days >= 30) report['30_days'].push({ customer, days });
        else if (days >= 15) report['15_days'].push({ customer, days });
        else report['others'].push({ customer, days });
      } else {
        report['others'].push({ customer, days: 0 });
      }
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/daily-collection', async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const ownerCustomers = await Customer.find({ OwnerId: ownerId }).select('_id');
    const customerIds = ownerCustomers.map(c => c._id);

    const collections = await Transaction.aggregate([
      { 
        $match: { 
          type: 'GOT', 
          date: { $gte: startOfDay, $lte: endOfDay },
          customerId: { $in: customerIds }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({ total: collections[0] ? collections[0].total : 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
