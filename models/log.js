const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logSchema = new mongoose.Schema({
  type: { type: String },
  author: { type: String },
  url: { type: String },
  body: { type: String },
  time : { type : Date, default: Date.now }
})


module.exports = mongoose.model('Log', logSchema);
