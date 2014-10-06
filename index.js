var request = require('request');
var cheerio = require('cheerio');
var validUrl = require('valid-url');
var URL = require('url');
var Q = require('q');


/*
 * Crawl a website and return data from inside a specified class.
 *
 * @param {string} url URL of the domain the user wishes to crawl.
 * @param {string} className The class to search for on the webpage.
 * @param {function} callback The callback function to handle the returned data.
 * @param {function} crawlModule A custom module for getting specific data out of the
 *      className class. The module must accept a jquery object representaion of html
 *      string and returns a promise.
 */
function crawlForData(url, className, callback, crawlModule) {
    //check if the . is in the class name. If it is not add it.
    if (className.indexOf('.') < 0) {
        className = '.' + className;
    }

    //check that the url is valid. If not exit.
    if (!validUrl.isUri(url)) {
        console.log('Not a valid URL!');
        return;
    }

    //request wepage
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var classContent = [];
            var promises = [];
            var deferred = Q.defer();

            //search and loop through each instance of the class className
            $(className).each(function (i, elem) {
                //check if the class is nested and ignore top level
                if ($(elem).find(className).length <= 0) {

                    var promise;
                    //for custom content you want parsed from the class
                    if (crawlModule) {

                        //The module takes a jquery HTML object
                        //Returns a promise
                        promise = crawlModule(elem);
                        promise.then(function (data) {
                            if (data) {
                                classContent.push(data);
                            }
                        });
                    } else {
                        //some premade crawlModules 
                        switch (URL.parse(url).hostname) {
                        case 'www.imdb.com':
                            //async process
                            promise = imdbCrawlModule(elem);
                            promise.then(function (data) {
                                if (data) {
                                    classContent.push(data);
                                }
                            });
                            break;
                            //TODO: Add more premade website specific crawlers 
                        default:
                            //generic content scraping
                            //this is syncronous
                            promise = genericCrawlModule(elem);
                            promise.then(function (data) {
                                if (data) {
                                    classContent.push(data);
                                }
                            });
                        }
                    }
                    promises.push(promise);
                }
            });

            //wait for all promises to be fulfilled and call the callback to 
            // return the crawled data.
            Q.all(promises).spread(function () {
                callback(classContent)
            }).done();
        }
    });

    /*
     * Get all links i.e) href or src from a html block.
     *
     * @param {String} element The top level element you want to search.
     * @param {String} tag What tag you want to access.
     * @param {String} attribute Which attribute you want to get your value from.
     * @return {Array} Returns an array of normalized links.
     */
    function getAllLinks(element, tag, attribute) {
        var links = [];
        var $ = cheerio.load(element);
        //for each tag get the value of the attribute
        $($(element).find(tag)).each(function (i, elem) {
            var link = $(elem).attr(attribute);

            link = normalizeLink(link);

            links.push(link);
        });
        return links
    }

    /*
     * Normalize a link i.e) ensure it is a stand alone URL
     *
     * @param {string} link The link you want to normalize.
     * @return {string} A normalized link.
     */
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

    /*
     * Generic crawlModule used as a backup if no module has been given
     *      and no module exists in the premade modules. This module grabs all href
     *      and img sources allong with a text version of the elements contents.
     *
     * @param {string} element The element you want to parse.
     * @return {promise}  A promise that when resolved gives an object containing
     *      all hrefs, image sources and text of the element.
     */
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


    /*
     * Module designed to get movie information from IMDB. It returns an object
     *      with the movies title, description, image, trail URL and current URL.
     *
     * @param {string} element The element you want to parse.
     * @return {promise}  A promise that when resolved gives an object containing the
     *      title, description, image, trail URL and current URL of the movie.
     */
    function imdbCrawlModule(element) {
        var links = getAllLinks(element, 'a', 'href');
        var deferred = Q.defer();

        if (links[0]) {
            //Must travel to new page with more information about the movie.
            request(links[0], function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    var $ = cheerio.load(body);

                    //prettify the title
                    var title = $(body).find('[itemprop="name"]').first().text().trim();

                    //prettify the description
                    var desc = $(body).find('[itemprop="description"]')
                        .text()
                        .replace(/\s{2,9999}/g, ' ')
                        .trim();

                    var image = $(body).find('[itemprop="image"]').attr('src');
                    //normalize
                    image = normalizeLink(image);

                    var trailer = $(body).find('[itemprop="trailer"]').attr('href');
                    //normalize
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
        } else {
            var $ = cheerio.load(element);
            var title = $(element).find('h4').first().text().trim();
            var image = $(element).find('img').attr('src');
            image = normalizeLink(image);
            deferred.resolve({
                title: title,
                desc: null,
                image: image,
                trailer: null,
                url: null
            });
        }
        return deferred.promise;
    }
}


module.exports = {
    crawlForData: crawlForData
}