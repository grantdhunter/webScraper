var request = require('request');
var cheerio = require('cheerio');
var validUrl = require('valid-url');


module.exports = {
    crawlForData: function (url, className, callback) {
        if (className.indexOf('.') < 0) {
            className = '.' + className;
        }

        if (!validUrl.isUri(url)) {
            console.log('Not a valid URL!');
            return;
        }
        console.log('className: ' + className);
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                console.log(body);
                var data = [];
                var tempData;

                $(className).each(function (i, elem) {
                    
                    console.log('******************** ' + i + ' ********************');
                    console.log('href ' + $(elem).find('a').attr('href'));
                    console.log('src ' + $(elem).find('img').attr('src'));
                   
                    
                    console.log('+++++++++++ ' + i + ' +++++++++++');
                    //look at top view
                    console.log('href ' + $(elem).attr('href'));
                    console.log('src ' + $(elem).attr('src'));
                    console.log('text ' + $(elem).text());

                    console.log('----------- ' + i + ' -----------');
                    //look at bottom view
                    tempData = $(this).find(':not(:has(*))');
                    console.log('href ' + $(tempData).attr('href'));
                    console.log('src ' + $(tempData).attr('src'));
                    console.log('text ' + $(tempData).text());
                    data.push(tempData);
                });
                callback(data);
            }
        });
    }

};