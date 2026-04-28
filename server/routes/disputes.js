const express = require('express');
const router = express.Router();
const Dispute = require('../models/Dispute');
const Customer = require('../models/Customer');

router.post('/', async (req, res) => {
  try {
    const { customerId, transactionId, reason, ownerId } = req.body;
    if (!customerId || !reason || !ownerId) {
      return res.status(400).json({ error: 'customerId, reason, and ownerId are required' });
    }

    const dispute = new Dispute({ customerId, transactionId, reason, ownerId });
    await dispute.save();
    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });

    const disputes = await Dispute.find({ ownerId }).sort({ createdAt: -1 });

    const populated = await Promise.all(disputes.map(async (d) => {
      const customer = await Customer.findById(d.customerId);
      return { ...d.toObject(), customerName: customer ? customer.Name : 'Unknown' };
    }));

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customer/:customerId', async (req, res) => {
  try {
    const disputes = await Dispute.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, resolution } = req.body;
    if (!['RESOLVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be RESOLVED or REJECTED' });
    }

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolution: resolution || '', resolvedAt: new Date() },
      { new: true }
    );
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
