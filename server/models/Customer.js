const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Phone: { type: String, required: true },
  Credit_Limit: { type: Number, default: 0 },
  Current_Balance: { type: Number, default: 0 },
  Repayment_Cycle: { type: String, enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'FLEXIBLE'], default: 'FLEXIBLE' },
  Next_Due_Date: { type: Date, default: null },
  OwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Is_Registered: { type: Boolean, default: false },
  Registered_UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  Created_At: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
