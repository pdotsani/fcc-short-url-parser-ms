'use strict';

const express = require('express');
const path = require('path');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/shortUrl';
const app = express();

/*
 * MODELS
 */
var UrlSchema = new Schema({
	uid: { type: Number, required: true },
	url: { type: String, required: true }
});

var URL = mongoose.model('URLSchema', UrlSchema);

/*
 * FEATURES
 */
function createID() {
	return Math.floor((Math.random() * (8999)) + 1000);
}

/*
 * ROUTES 
 */
app.get('/', function(req, res) {
	res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get('/favicon.ico', function(req, res) {
   res.sendStatus(204);
});


app.get('/:id', function(req, res) {
	var id = req.params.id;
	URL.findOne({ uid: id })
		.exec(function(err, urlDoc) {
			if(err) throw err;
			if(!urlDoc) return res.sendStatus(404);
			return res.redirect(urlDoc.url);
		});
});

app.get('/new/*', function(req, res) {
	var url = req.params[0];
	var validUrl = new RegExp('https{0,1}:\/\/');
	if(validUrl.test(url)) {
		URL.findOne({ url: url })
			.exec(function(err, result) {
				if(err) throw err;
				if(!result) {
					var doc = new URL({
						uid: createID(),
						url: url
					});
					doc.save(function(err) {
						if(err) throw err;
						return res.json({
							short: `${req.headers.host}/${doc.uid}`,
							url: doc.url
						});
					});
				} else {
					return res.status(302).json({ 
						short: `${req.headers.host}/${result.uid}`,
						url: result.url
					});
				}
			});
	} else {
		return res.sendStatus(400);
	}
});

// Connect to database
mongoose.connect(mongoUri);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

// Use native promises
mongoose.Promise = global.Promise;

app.listen(port, function() {
	console.log(`mongoUri: ${mongoUri}`);
	console.log('short-url-ms listening on port ' + port);
});