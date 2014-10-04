var webScraper = require('../../webScraper');
var fs = require('fs');
var url = process.argv[2];
var className = process.argv[3];

// call the webscraper and print out the data to a file
webScraper.crawlForData(url, className, function (data) {
    fs.writeFile('output.json', JSON.stringify(data, null, 2), function (err) {
        if (err) {
            throw err;
        }
        //tell user the data has been saved
        console.log('Saved');
    });
});