const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  id: { type: Schema.Types.ObjectId, ref: 'Alumni' },
  dateDonated: { type: String },
  amountDonated: { type: String },
  purposeDonated: { type: String },
})


module.exports = mongoose.model('Donation', donationSchema);
