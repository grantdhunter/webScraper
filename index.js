var request = require('request');
var cheerio = require('cheerio');
var validUrl = require('valid-url');
var URL = require('url');

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
                var data = [];


                $(className).each(function (i, elem) {
                    //check if the class is nested and ignore top level
                    if ($(elem).find(className).length <= 0) {
                        var links = [];
                        var imgs = []

                        $($(this).find('a')).each(function (i, elem) {
                            var link = $(elem).attr('href');

                            if (!validUrl.isUri(link)) {
                                if (link.indexOf('/') != 0) {
                                    link = '/' + link;
                                }
                                link = URL.parse(url).protocol + '//' + URL.parse(url).hostname + link;
                            }
                            links.push(link);
                        });

                        $($(this).find('img')).each(function (i, elem) {
                            var img = $(elem).attr('src');

                            if (!validUrl.isUri(link)) {
                                if (img.indexOf('/') != 0) {
                                    img = '/' + img;
                                }
                                img = URL.parse(url).protocol + '//' + URL.parse(url).hostname + img;
                            }
                            imgs.push(img);
                        });

                        var content = $(elem).text().replace(/\s{2,9999}/g, ' ');


                        //
                        //                        request(link, function (error, response, body) {
                        //                            if (!error && response.statusCode == 200) {
                        //                            
                        //                            }
                        //                        });

                        data.push({
                            links: links,
                            imgs: imgs,
                            content: content
                        });
                    }
                });
                callback(data);
            }
        });
    }

};