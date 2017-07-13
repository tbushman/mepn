var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var User = new Schema({
  position: {
    zoom: Number,
    lat: Number,
    lng: Number
  }
}, { collection: 'mepnuser' });

module.exports = mongoose.model('User', User);
