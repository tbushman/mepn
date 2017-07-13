var express = require('express');
var router = express.Router();
var url = require('url');
var spawn = require('child_process').spawn;
// Mongoose models
var Content = require('../models/content.js');
var User = require('../models/user.js');
// Multipart form
var multer = require('multer');
// Ensure .env access
var dotenv = require('dotenv');
// Init multer
var upload = multer();
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
				return res.redirect('/addfeature')
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

router.all('/search/:term/:field', function(req, res, next){
	var term = req.params.term;
	var regex = new RegExp(term);
	console.log(regex)
	var key = 'properties.'+req.params.field+'';
	Content.find({key: {$regex: regex}}, function(err, data){
		if (err) {
			return next(err)
		}
		return res.json(data)
	})
})

router.all('/api/deletefeature/:id', function(req, res, next) {
	var id = parseInt(req.params.id, 10);
	Content.findOne({id: id}, function(err, doc){
		if (err) {
			return next(err)
		}
		Content.remove({id: id}, 1, function(err, data){
			if (err) {
				return next(err)
			}
			User.find({}, function(err, user){
				if (err) {
					return next(err)
				}
				return res.render('home', {
					id: data.length - 1,
					zoom: user.zoom,
					data: data,
					lng: doc.geometry.coordinates[0],
					lat: doc.geometry.coordinates[1],
					info: 'Deleted'
				})
			})
		})
	})
})

router.get('/addfeature', function(req, res, next) {
	Content.find({}, function(err, data){
		if (err) {
			return next(err)
		}
		User.findOne({_id: req.app.locals.user._id}, function(err, user){
			if (err) {
				return next(err)
			}
			return res.render('home', {
				infowindow: 'point',
				data: [].map.call(data, function(doc){return doc}),
				lat: user.position.lat,
				lng: user.position.lng,
				zoom: user.position.zoom,
				info: 'drag the feature to the desired location'
			})
		})
	})
})

router.get('/addshape', function(req, res, next) {
	Content.find({}, function(err, data){
		if (err) {
			return next(err)
		}
		User.findOne({_id: req.app.locals.user._id}, function(err, user){
			if (err) {
				return next(err)
			}
			return res.render('home', {
				infowindow: 'shape',
				data: [].map.call(data, function(doc){return doc}),
				lat: user.position.lat,
				lng: user.position.lng,
				zoom: user.position.zoom,
				info: 'draw vectors and submit when finished. '
			})
		})
	})
})

router.post('/addcontent/:id', upload.array(), function(req, res, next){
	var entry;
	User.findOne({_id: req.app.locals.user._id}, function(err, user){
		if (err) {
			return next(err)
		}
		var body = req.body;
		var keys = Object.keys(body);
		var id = parseInt(req.params.id, 10);
		entry = {
			_id: id,
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'Point',
				coordinates: [user.position.lng, user.position.lat]
			}
		}
		keys.map(function(key){
			return entry.properties[key] = body[key]
		});

		var newentry = new Content(entry)

		newentry.save(function(err, doc){
			if (err) {
				console.log(err);  // handle errors!
			}
			/*Content.find({}, function(err, data){
				if (err) {
					return next(err)
				}
				return res.render('home', {
					infowindow: 'doc',
					id: id,
					zoom: user.position.zoom,
					data: [].map.call(data, function(doc){return doc}),
					lat: user.position.lat,
					lng: user.position.lng,
					info: ':)'
				})
			})*/
			return res.redirect('/')
		})
	})
})

module.exports = router;
