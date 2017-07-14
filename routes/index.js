var express = require('express');
var fs = require('fs');
var path = require('path');
var url = require('url');
var router = express.Router();
// For parsing csv
var d3 = require('d3');
// For geolocation process
var spawn = require('child_process').spawn;
// Mongoose models
var Content = require('../models/content.js');
var User = require('../models/user.js');
// D3 for parsing csv
var d3 = require('d3');
// Multipart form
var multer = require('multer');
// Ensure .env access
var dotenv = require('dotenv');
// Init multer
var upload = multer();
/*var storage = multer.diskStorage({
	destination: 'csv/',
	filename: Date.now() + '.csv'
});
var uploadmedia = multer({storage: storage});*/
//always
dotenv.load();
// Unofficial Google Geolocation module
var geolocation = require ('google-geolocation') ({
	key: process.env.GOOGLE_KEY
});

router.get('/', function (req, res, next) {
	User.find({}, function(err, users){
		if (err) {
			return next(err)
		}
		if (!err && users.length === 0) {
			return res.redirect('/geolocate')
		}
		req.app.locals.user = users[0]
		Content.find({}, function(err, data){
			if (err) {
				return next(err)
			}
			if (!err && data.length === 0) {
				return res.redirect('/importcsv')
			}
			return res.render('home', {
				data: [].map.call(data, function(doc){return doc}),
				lat: users[0].position.lat,
				lng: users[0].position.lng,
				zoom: users[0].position.zoom
			})
		})
	})
});

router.get('/geolocate', function(req, res, next){
	var arp = spawn('arp', ['-a']);
	//console.log(arp.stdio[0].Pipe)
	var mac;
	arp.stdout.on('data', function(data){
		data += '';
		data = data.split('\n');
		mac = data[0].split(' ')[3];
	})
	// Configure API parameters
	const params = {
		wifiAccessPoints: [{
			macAddress: ''+mac+'',
			signalStrength: -65,
			signalToNoiseRatio: 40
		}]
	};
	geolocation(params, function(err, data) {
		if (err) {
			console.log (err);
		}
		loc = JSON.parse(JSON.stringify({ lng: data.location.lng, lat: data.location.lat }));
		User.find({}, function(err, users){
			if (err) {
				return next(err)
			}
			if (!err && users.length === 0) {
				var user = new User({
					position: {
						lat: loc ? loc.lat : 40.6,
						lng: loc ? loc.lng : -111.8,
						zoom: 10
					}
				});
				user.save(function(err, user){
					if (err) {
						console.log(err)
					}
					req.app.locals.user = user;
					return res.redirect('/')
				})
			} else {
				req.app.locals.user = users[0]
				return res.redirect('/')
			}
		})
	});
});

// Each time marker moves, update user location
router.post('/panzoom/:lat/:lng/:zoom', function(req, res, next){
	var zoom = parseInt(req.params.zoom, 10);
	var lat = parseFloat(req.params.lat);
	var lng = parseFloat(req.params.lng);
	var position = {
		lat: lat,
		lng: lng,
		zoom: zoom
	}
	var set = {
		$set: {
			position: position
		}
	};
	var options = {
		safe: true,
		new: true,
		upsert: false
	}
	User.findOneAndUpdate({_id: req.app.locals.user._id}, set, options, function(err, user){
		if (err) {
			return next(err)
		}
		return res.send('ok')
	})
})

router.get('/importcsv', function(req, res, next){
	fs.readFile(path.join(__dirname, '../public/csv/grocery.csv'), 'utf8', function (err, content) {
		if (err) {
			return console.log(err)
		}
		//console.log('content: '+content)
		var json = d3.csvParse(content);
		for (var i = 0; i < json.length; i++) {
			var entry = new Content({
				_id: i,
				type: 'Feature',
				properties: {
					title: json[i].name
				},
				geometry: {
					type: 'Point',
					coordinates: [parseFloat(json[i].longitude), parseFloat(json[i].latitude)]
				}
			})
			entry.save(function(err){
				if (err) {
					console.log(err)
				}
			})
		}
		User.find({}, function(err, users) {
			if (err) {
				return next(err)
			}
			Content.find({}, function(err, data) {
				if (err) {
					return next(err)
				}
				return res.render('home', {
					data: [].map.call(data, function(doc){return doc}),
					lat: users[0].position.lat,
					lng: users[0].position.lng,
					zoom: users[0].position.zoom
				})
			})
		})
	})
})

module.exports = router;
