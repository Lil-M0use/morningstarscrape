var express  = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var schedule = require('node-schedule');
var scraper = require('./Scrape/main');
var dbrebuild = require('./Scrape/rebuilddb');

var CsvReadableStream = require('csv-reader');
var inputStream = fs.createReadStream('./etf_list.csv', 'utf8');

var app = express();
var port = 8055;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var j = schedule.scheduleJob('0 0 * * *',  async function(){
  // Lets Run the scaper Everyday at 12AM
    dbrebuild.build();
    var csv = [];
    inputStream.pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
      csv.push(row);
    }).on('end', function (data) {
      scraper.scrape(data);
    });
});

//Express setup
app.use(express.static(__dirname + '/views'));
app.listen(port);

console.log('Scrap API running on port: ' + port);
var routes = require('./Routes/routes');

app.use(function (req, res, next) {
  //Crons setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', routes);
