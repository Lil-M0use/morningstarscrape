var sqlite3 = require('sqlite3').verbose();

exports.build = function() {
  let db = new sqlite3.Database('./DB/morningstar.db', (err) => {
        if(err){
          console.error(err.message);
        }else{ //Rebuild the database. Create the tables if they dont exits. If they do drop all the data
          db.run("CREATE TABLE if not exists company (companyName TEXT, companyTicker TEXT, holdingsAmount REAL)");
          db.run("CREATE TABLE if not exists holdings (companyTicker TEXT, holdingsName TEXT, holdingsPortOffer REAL, holdingsSharesOwned TEXT, holdingsFirstBought TEXT, holdingsStyle TEXT, holdingsSector TEXT, holdingsCountry TEXT, holdingsYTD REAL)", function(err) {
            if(err){
              console.log(err);
            }else{
              console.log("built");
              db.run("DELETE FROM  company");
              db.run("DELETE FROM  holdings");
              db.close();
            }
        });
      }
  });
}
