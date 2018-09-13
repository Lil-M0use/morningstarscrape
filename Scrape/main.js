var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var scraper = require('./scraper');

exports.scrape = function(csv) {
  let db = new sqlite3.Database('./DB/morningstar.db', (err) => { //Open the database
    if (err) {
      console.error(err.message);
    }else{
      if(!csv){
        console.log("No CSV was provided");
      }else{
        if(parseExchangeSymbol(csv[1][1]) == null){
          console.log("CSV incorrect format");
        }else{
          runScrape();
        }
      }
  }
  });
  function parseExchangeSymbol(exchangeSymbol){ //Morningstar Uses a different symbol then what we have the CSV so parsing it. Also used to verify if the Data is valid
    switch(exchangeSymbol) {
        case 'ARCA':
          return 'ARCX';
        case 'LSE':
          return 'XLSE';
        case 'ASX':
          return 'XASX';
        default:
            return null;
      }
  }


  async function runScrape(){ //Async function to run one by one. dont want them to all run at once as it will crash the process
      for(var element of csv){  //Looping through CSV with key element
        if(parseExchangeSymbol(element[1])){ //Uses the parseExchangeSymbol function to check if the Symbol we got from CSV is valid
          var value = await scraper.scraper(parseExchangeSymbol(element[1]) +":"+ element[2]);
              if(value){ //if there is a value.
                    db.run(`INSERT INTO company(companyName,companyTicker, holdingsAmount) VALUES ("${value[0].companyName}", "${value[0].companyTicker}", "${value.length-1}")`, function(err) {
                        if(err){
                          console.log(err.message);
                        }
                        delete value[0]; // Delete the Company information from the array. Since it's always stored at 0 Index
                        console.log(`A row has been inserted with rowid ${this.lastID}`);
                        for (var values of value){ // looping throught the rest of the data.......
                          if(values != null){ // Checking if nulllllllll.  Using logic isn't my key skill
                            db.run(`INSERT INTO holdings(companyTicker, holdingsName, holdingsPortOffer, holdingsSharesOwned, holdingsFirstBought, holdingsStyle, holdingsSector, holdingsCountry, holdingsYTD) VALUES
                                  ("${values.companyticker}", "${values.holdingsName}","${values.holdingsPortOffer}","${values.holdingsSharesOwned}","${values.holdingsFirstBought}","${values.holdingsStyle}","${values.holdingsSector}","${values.holdingsCountry}","${values.holdingsYTD}")`, function(err) {
                                if(err){
                                  console.log(err.message);
                                } //Insert that into the sqllite db. WE will use the Ticker as a way to link the holdings to the company
                            });
                          }
                        }
                    });
              }
        }
      }
      db.close(); // close the db ^.^ we have finished the scrape.
      console.log("Closed DB");
  }
}
