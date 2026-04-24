const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Phone: { type: String, required: true },
  Password: { type: String, required: true },
  Role: { type: String, enum: ['Shop_Owner', 'Customer'], required: true },
  Shop_Name: { type: String }
});

userSchema.index({ Phone: 1, Role: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('Password')) return next();
  this.Password = await bcrypt.hash(this.Password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.Password);
};

module.exports = mongoose.model('User', userSchema);
