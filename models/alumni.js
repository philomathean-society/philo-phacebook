const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const alumniSchema = new mongoose.Schema({
  admitYear: { type: String }, 
  firstName: { type: String }, 
  middleName: { type: String },
  lastName: { type: String },
  gradYear: { type: String },
  pennCareer: { type: String },
  postPennCareer: { type: String },
  genComments: { type: String },
  profilePic: { type: String },
  tag: { type: String },
  correspondences: [{ type: Schema.Types.ObjectId, ref: 'Correspondence' }],
  donations: [{ type: Schema.Types.ObjectId, ref: 'Donation' }]
});

module.exports = mongoose.model('Alumni', alumniSchema);
