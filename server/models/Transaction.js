const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['GAVE', 'GOT'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ['PARTIAL', 'SETTLED'], default: null },
  paymentClassification: { type: String, enum: ['EARLY', 'ON_TIME', 'LATE'], default: null }
});

module.exports = mongoose.model('Transaction', transactionSchema);
