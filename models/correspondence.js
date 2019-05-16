const mongoose = require('mongoose');
const Schema = mongoose.Schema

const correspondenceSchema = new mongoose.Schema({
  alumniId: { type: Schema.Types.ObjectId, ref: 'Alumni' },
  corrTitle: { type: String },
  text: { type: String },
  dateCorresponded: { type: String },
  attachmentLink: { type: String },
  tag: { type: String },
  sticky: { type: Boolean }
})

module.exports = mongoose.model('Correspondence', correspondenceSchema);
