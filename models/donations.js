const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const donationSchema = new mongoose.Schema({
  alumniId: { type: Schema.Types.ObjectId, ref: 'Alumni' },
  donationAmount: { type: String },
  text: { type: String },
  dateDonated: { type: String },
  attachmentLink: { type: String }
})


module.exports = mongoose.model('Donation', donationSchema);
