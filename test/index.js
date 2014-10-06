var webScraper = require('../../webScraper');
var fs = require('fs');
var cheerio = require('cheerio');
var Q = require('q');

var url = process.argv[2];
var className = process.argv[3];




// call the webscraper and print out the data to a file
webScraper.crawlForData(url,
    className,
    function (data) {
        fs.writeFile('output.json', JSON.stringify(data, null, 2), function (err) {
            if (err) {
                throw err;
            }
            //tell user the data has been saved
            console.log('Saved');
        });
    }//,
    //place function for custom scraping
   
);

//crawlModule good for Hacker news
//    function (elem) {
//
//        var $ = cheerio.load(elem);
//        var deferred = Q.defer();
//        var link = $(elem).find('a').attr('href');
//        var content = $(elem).text().replace(/\s{2,9999}/g, ' ').trim();
//        var temp = {
//            link: link,
//            content: content
//        };
//        if (temp.link) {
//            deferred.resolve(temp)
//        } else {
//            deferred.resolve(null)
//        };
//        return deferred.promise;
//    }
//eval("var c = function (elem) {var $ = cheerio.load(elem);var deferred = Q.defer();var link = $(elem).find('a').attr('href');var content = $(elem).text().replace(/\s{2,9999}/g, ' ').trim();var temp = {link: link,content: content};if (temp.link) {deferred.resolve(temp)} else {deferred.resolve(null)};return deferred.promise;};");