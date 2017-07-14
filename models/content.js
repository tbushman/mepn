var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var contentSchema = new Schema({
  _id: Number,
  type: String,
  properties: {
    title: String,
    description: String
  },
  geometry: {
    'type': {type: String},
    coordinates: []
  }
}, { collection: 'mepn' })
module.exports = mongoose.model('Content', contentSchema);
