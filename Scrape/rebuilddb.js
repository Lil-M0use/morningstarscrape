var sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./DB/morningstar.db', (err) => { //Open the database
      if(err){
        console.error(err.message);
      }else{
        db.run("DROP TABLE if exists company");
        db.run("DROP TABLE if exists holdings");

        db.run("CREATE TABLE if not exists company (companyName TEXT, companyTicker TEXT, holdingsAmount REAL)");
        db.run("CREATE TABLE if not exists holdings (companyTicker TEXT, holdingsName TEXT, holdingsPortOffer REAL, holdingsSharesOwned TEXT, holdingsFirstBought TEXT, holdingsStyle TEXT, holdingsSector TEXT, holdingsCountry TEXT, holdingsYTD REAL)", function(err) {
          if(err){
            console.log(err);
          }
          console.log("built");
          db.close();
      });
    }
});
