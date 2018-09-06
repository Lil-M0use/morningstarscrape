var fs = require('fs');
var config  = require('../config.js');
var sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./DB/morningstar.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database on main controller.')
});

module.exports = {
    GetIndex : function(req, res){
      console.log("Loading HomePage");
       fs.readFile('./views/index.html', function (err, html) {
           if(err){
              throw err;
            }
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':html.length});
        res.write(html);
        res.end();
      });
    },
    GetCompanies : function(req, res){
      let comps = [];
        db.all('SELECT * from company', (err, rows) => {
          if (err) {
            res.json({status:false,error:"Error quering DB"});
            throw err;
          }
          res.json({status:true,companies:rows});
        });
    },
    GetCompany : function(req, res){
      let ticker = req.params.ticker;
      db.get('SELECT * from company WHERE companyTicker = ?',[ticker], (err, row) => {
        if (err) {
          res.json({status:false,error:"Error quering DB"});
          throw err;
        }
        db.all('SELECT * from holdings WHERE companyTicker = ?',[ticker], (err, holdings) => {
            if (err) {
              res.json({status:false,error:"Error quering DB"});
              throw err;
            }
            res.json({status:true,company:row, holdings: holdings});
          });
      });
    },

    get404 : function(req, res){
      res.json({status:true,message:"404"});
    },

}
