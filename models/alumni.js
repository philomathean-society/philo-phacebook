const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;
const Donation = require('./donations');

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
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  correspondences: [{ type: Schema.Types.ObjectId, ref: 'Correspondence' }],
  donations: [{ type: Schema.Types.ObjectId, ref: 'Donation' }],
  donorTotal: { type: Number, default: 0 }
});

alumniSchema.methods.recalculate = function(cb) {
  self = this;
  self.model('Alumni').findById(self._id).populate('donations')
    .exec(function(e, r) {
      var t = r.donations.map(i => {
        var am = i.donationAmount.match(/\d+(?:\.\d+)?/g);
        console.log(am);
        if (am && am.length > 0) {
          return Number(am[0]);
        } else {
          return 0;
        }
      })
      self.donorTotal = t.reduce((a, v) => a + v, 0);
      self.donorTotal = self.donorTotal.toFixed(2);
      console.log(this.donorTotal);
      self.save(function(err, r2) {
        cb(null, r2);
      })
  });
}

alumniSchema.statics.findOneOrCreate = function findOneOrCreate(condition, doc, callback) {
  const self = this;
  self.findOne(condition, (err, result) => {
    return result 
      ? callback(err, result)
      : self.create(doc, (err, result) => {
        return callback(err, result);
      });
  });
};

module.exports = mongoose.model('Alumni', alumniSchema);
