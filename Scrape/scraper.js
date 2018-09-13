var puppeteer = require('puppeteer');

exports.scraper = async function(ticker) {
    //   LSE dosen't get scraped, is in different format.
    console.log("Scraping: " + ticker);
    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({headless: false});
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


}
