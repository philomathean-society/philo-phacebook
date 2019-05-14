const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const tagSchema = new mongoose.Schema({
  tagName: { type: String },
})

module.exports = mongoose.model('Tag', tagSchema);
