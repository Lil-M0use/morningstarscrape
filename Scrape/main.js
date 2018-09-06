var puppeteer = require('puppeteer');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

exports.scrape = function(csv) {
let db = new sqlite3.Database('./DB/morningstar.db', (err) => { //Open the database
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
  db.run("DROP TABLE if exists company");
  db.run("DROP TABLE if exists holdings");
  //Checking if CSV file is correctly formated and present
  if(!csv){
    console.log("No CSV was provided");
  }else{
    if(parseExchangeSymbol(csv[1][1]) == null){
      console.log("CSV incorrect format");
    }else{
      initTables();
    }
  }
});

let scrape = async (ticker) => {
    //   LSE dosen't get scraped, is in different format.
    console.log("Scraping: " + ticker);
    const browser = await puppeteer.launch();
    // const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('http://portfolios.morningstar.com/fund/holdings?t='+ticker);
    //Evaluating the page for content
    const result = await page.evaluate(() => {
      if(document.querySelector('body > div.wrapper > div.r_bodywrap > div.r_header > div > div.r_title > span.gry')){ //checking if page is aviable
        let companyTicker = document.querySelector('body > div.wrapper > div.r_bodywrap > div.r_header > div > div.r_title > span.gry').innerText;
        let companyName = document.querySelector('body > div.wrapper > div.r_bodywrap > div.r_header > div > div.r_title > h1').innerText;
        companyTicker = companyTicker.replace(/\s/g, '');
        //Data array to store what we got from the scrape
        let data = [];
        let elements = document.querySelectorAll('#holding_epage0 > tr'); //grab all the TR elements with id
        data.push({ //Pushing the company information to the data array
            companyName: companyName,
            companyTicker: companyTicker
        });
        for (var element of elements){ //Looping elements
          if(element.querySelector('th > a') !== null){ //Checking if the table is nulled
            let sectorTitle = "NA";
            let ticker = "NA";
            let styleClass = "NA";
            //Getting the Ticker from URL And checking if it's nulled
            let regex = /(?<=aspx\?t=).*$/ //I dont like regex. No-one understands it. So it's basically this
            if(element.querySelector('td:nth-child(12) > a')){ //check its there 0
               ticker = element.querySelector('td:nth-child(12) > a').href.match(regex).toString();
            }
            if(element.querySelector('td:nth-child(8) > span')){ //check its there 1
               sectorTitle = element.querySelector('td:nth-child(8) > span').title
            }
            if(element.querySelector('td:nth-child(9) > span')){//check its there 2
                styleClass = element.querySelector('td:nth-child(9) > span').className;
            }
            //Pushing Scraped Data push push push push
            data.push({ // Could use a child-node reference but eh. This works fine for now.
              companyticker: companyTicker,
              holdingsTicker: ticker,
              holdingsName: element.querySelector('th > a').innerText,
              holdingsPortOffer: element.querySelector('td:nth-child(5)').innerText,
              holdingsSharesOwned: element.querySelector('td:nth-child(6)').innerText,
              holdingsFirstBought: element.querySelector('td.sdata').innerText,
              holdingsStyle: styleClass,
              holdingsSector: sectorTitle,
              holdingsCountry: element.querySelector('td:nth-child(13)').innerText,
              holdingsYTD: element.querySelector('td.today').innerText
            });

          }
        }
      return data;
    }
    });

    browser.close();
    return result; // Return the data
};

function initTables(){ // Create the tables.
  db.run("CREATE TABLE if not exists company (companyName TEXT, companyTicker TEXT, holdingsAmount REAL)");
  db.run("CREATE TABLE if not exists holdings (companyTicker TEXT, holdingsName TEXT, holdingsPortOffer REAL, holdingsSharesOwned TEXT, holdingsFirstBought TEXT, holdingsStyle TEXT, holdingsSector TEXT, holdingsCountry TEXT, holdingsYTD REAL)", function(err) {
    if(err){
      console.log(err);
    }
  });
  console.log("Tables Created");
  runScrape();
}

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
        await scrape(parseExchangeSymbol(element[1]) +":"+ element[2]).then((value) => { // runs the Scrape function in async. Once done then procceed with the data
            if(value){ //if there is a value.
                  db.run(`INSERT INTO company(companyName,companyTicker, holdingsAmount) VALUES ("${value[0].companyName}", "${value[0].companyTicker}", "${value.length-1}")`, function(err) {
                      if (err) {
                        return console.log(err.message);
                      }
                      delete value[0]; // Delete the Company information from the array. Since it's always stored at 0 Index ('arrays start at 1 Kappa')
                      console.log(`A row has been inserted with rowid ${this.lastID}`);
                      for (var values of value){ // looping throught the rest of the data.......
                        if(values != null){ // Checking if nulllllllll.  Using logic isn't my key skill
                          db.run(`INSERT INTO holdings(companyTicker, holdingsName, holdingsPortOffer, holdingsSharesOwned, holdingsFirstBought, holdingsStyle, holdingsSector, holdingsCountry, holdingsYTD) VALUES
                                ("${values.companyticker}", "${values.holdingsName}","${values.holdingsPortOffer}","${values.holdingsSharesOwned}","${values.holdingsFirstBought}","${values.holdingsStyle}","${values.holdingsSector}","${values.holdingsCountry}","${values.holdingsYTD}")`, function(err) {
                              if (err) {
                                return console.log(err.message);
                              } //Insert that into the sqllite db. WE will use the Ticker as a way to link the holdings to the company
                          });
                        }
                      }
                  });
            }
        });
      }
    }
    db.close(); // close the db ^.^ we have finished the scrape.
    console.log("Closed DB");
    //Sometime i wonder why i even get paid to write code. It's terrible
}
}
