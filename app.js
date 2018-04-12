var express = require('express');
var app = express();
var mongoose = require('mongoose');
var Mockgoose = require('mockgoose').Mockgoose;
var mockgoose = new Mockgoose(mongoose);
var config = require('./config');
var initController = require('./controllers/initController');
var apiController = require('./controllers/apiController');

var port = process.env.PORT || 3000;

mockgoose.prepareStorage().then(function() {
    mongoose.connect('mongodb://ccas.com/testingDB');
});

initController();
apiController(app);

app.listen(port);