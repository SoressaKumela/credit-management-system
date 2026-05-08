const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const { validatePhone, normalizePhone } = require('../utils/validation');

router.post('/login', async (req, res) => {
  try {
    const { Phone, Password, Role } = req.body;

    if (!Phone || !Password || !Role) {
      return res.status(400).json({ error: 'Phone, Password, and Role are required.' });
    }

    if (!validatePhone(Phone)) {
      return res.status(400).json({ error: 'Invalid phone number. Use format: 09XXXXXXXX' });
    }

    const normalizedPhone = normalizePhone(Phone);

    let user = await User.findOne({ Phone: normalizedPhone, Role });
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    const isMatch = await user.comparePassword(Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const userObj = user.toObject();
    delete userObj.Password;
    return res.json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { Phone, Name, Shop_Name, Password, Role } = req.body;

    if (!Phone || !Name || !Password || !Role) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    
    if (Role === 'Shop_Owner' && !Shop_Name) {
      return res.status(400).json({ error: 'Shop Name is required for Shop Owners.' });
    }

    if (!validatePhone(Phone)) {
      return res.status(400).json({ error: 'Invalid phone number. Use format: 09XXXXXXXX' });
    }

    if (Password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedPhone = normalizePhone(Phone);

    let existing = await User.findOne({ Phone: normalizedPhone, Role });
    if (existing) {
      return res.status(400).json({ error: `Phone number already registered as a ${Role.replace('_', ' ')}.` });
    }

    const user = new User({ Name, Phone: normalizedPhone, Password, Role, Shop_Name: Role === 'Shop_Owner' ? Shop_Name : undefined });
    await user.save();

    if (Role === 'Customer') {
       await Customer.updateMany(
         { Phone: normalizedPhone, Is_Registered: false },
         { Is_Registered: true, Registered_UserId: user._id }
       );
    }

    const userObj = user.toObject();
    delete userObj.Password;
    res.json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    const { Name, Shop_Name } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { Name, Shop_Name }, { new: true }).select('-Password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  res.json({ success: true });
});

module.exports = router;
