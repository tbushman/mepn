var express = require('express');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var routes = require('./routes/index');
var Content = require('./models/content');

// Init db
var uri = 'mongodb://localhost/mepn';
var promise = mongoose.connect(uri, {
	useMongoClient: true
})
promise.then(function(db){
	db.on('error', console.error.bind(console, 'connection error:'));
})

// Init app
var app = express();

app.set('port', '2222');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.appTitle = 'map\'n w / mepn';

// For multipart forms
app.use(bodyParser.json());
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(urlencodedParser);

var sess = {
	secret: '12345QWERTY-SECRET',
	name: 'nodecookie',
	resave: false,
	saveUninitialized: true,
	cookie: {}
}
// session middleware configuration
// see https://github.com/expressjs/session
app.use(session(sess));

// Serve static resources
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use(function (err, req, res, next) {
	res.render('error', {
		status: err.status || 500,
		error: err
	});
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});
