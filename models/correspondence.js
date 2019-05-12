const mongoose = require('mongoose');
const Schema = mongoose.Schema

const correspondenceSchema = new mongoose.Schema({
  alumniId: { type: Schema.Types.ObjectId, ref: 'Alumni' },
  corrTitle: { type: String },
  text: { type: String },
  dateCorresponded: { type: String },
  attachmentLink: { type: String }
})

module.exports = mongoose.model('Correspondence', correspondenceSchema);
