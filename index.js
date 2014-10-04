var request = require('request');
var cheerio = require('cheerio');
var validUrl = require('valid-url');
var URL = require('url');
var Q = require('q');

function crawlForData(url, className, callback, crawlModule) {
    if (className.indexOf('.') < 0) {
        className = '.' + className;
    }

    if (!validUrl.isUri(url)) {
        console.log('Not a valid URL!');
        return;
    }

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var classContent = [];
            var promises = [];
            var deferred = Q.defer();

            $(className).each(function (i, elem) {
                //check if the class is nested and ignore top level
                if ($(elem).find(className).length <= 0) {

                    var promise;

                    //for custom content you want parsed from the URL
                    if (crawlModule) {
                        promise = crawlModule(elem);
                        promise.then(function (data) {
                            classContent.push(data);
                        });
                        promises.push(promise);
                    } else {
                        //some premade crawlModules
                        switch (URL.parse(url).hostname) {
                        case 'www.imdb.com':
                            //async process
                            promise = imdbCrawlModule(elem);
                            promise.then(function (data) {
                                classContent.push(data);
                            });
                            promises.push(promise);
                            break;
                        default:
                            //generic content scraping
                            //this is syncronous
                            promise = genericCrawlModule(elem);
                            promise.then(function (data) {
                                classContent.push(data);
                            });
                            promises.push(promise);
                        }
                    }
                }
            });

            Q.all(promises).spread(function () {
                callback(classContent)
            }).done();
        }
    });

    //get all URLS inside the 
    function getAllLinks(element, tag, attribute) {
        var links = [];
        var $ = cheerio.load(element);
        $($(element).find(tag)).each(function (i, elem) {
            var link = $(elem).attr(attribute);

            link = normalizeLink(link);

            links.push(link);
        });
        return links
    }

    function normalizeLink(link) {
        if (link) {
            if (!validUrl.isUri(link)) {
                if (link.indexOf('/') != 0) {
                    link = '/' + link;
                }
                link = URL.parse(url).protocol + '//' + URL.parse(url).hostname + link;
            }
        }
        return link;
    }

    function genericCrawlModule(element) {
        var $ = cheerio.load(element);
        var deferred = Q.defer();

        var tempContent = {
            links: getAllLinks(element, 'a', 'href'),
            imgs: getAllLinks(element, 'img', 'src'),
            content: $(element).text().replace(/\s{2,9999}/g, ' ').trim()
        };

        deferred.resolve(tempContent);

        return deferred.promise;
    }


    function imdbCrawlModule(element) {
        var links = getAllLinks(element, 'a', 'href');
        var deferred = Q.defer();

        request(links[0], function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var $ = cheerio.load(body);

                var title = $(body).find('[itemprop="name"]').first().text().trim();
                var desc = $(body).find('[itemprop="description"]').text().replace(/\s{2,9999}/g, ' ').trim();
                var image = $(body).find('[itemprop="image"]').attr('src');
                image = normalizeLink(image);
                var trailer = $(body).find('[itemprop="trailer"]').attr('href');
                trailer = normalizeLink(trailer);
                var link = links[0];

                deferred.resolve({
                    title: title,
                    desc: desc,
                    image: image,
                    trailer: trailer,
                    url: link
                });
            } else {
                deferred.reject(new Error(error));
            }
        });
        return deferred.promise;
    }
}


module.exports = {
    crawlForData: crawlForData
}