/*global require, $, phantom, console */
/*jslint plusplus: true */
var params = require('../params.json'),
    fs = require("fs"),
    url = params.downloadsPath + '/' + params.index_html,
    countriesBasePath = params.dataPath + '/' + params.countries_path;

function parseCountryProfile(url, callback) {
    "use strict";

    var page = require('webpage').create();

    page.open(url, function (status) {
        var results = {};

        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open country page URL:' + url);
            }
            return;
        }

        //retrieve country profile page
        results = page.evaluate(function () {
            var countryData = {};
            countryData.background = $("#data .category_data").text();

            return countryData;
        });

        page.close();
        callback(null, results);
    });
}

function parseCountriesList(url, baseOutputPath, callback) {
    "use strict";
    var page = require('webpage').create();

    page.open(url, function (status) {
        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open rank order base URL:' + url);
            }
            phantom.exit();
            return;
        }

        //retrieve country list
        var results = page.evaluate(function () {
                var countriesOptionResults = $("select.selecter_links option"),
                    countries = [];

                $.each(countriesOptionResults, function (idx, val) {
                    var valEl = $(val);

                    if (valEl.attr('value') !== '') {
                        countries.push(
                            {
                                url: valEl.attr('value'),
                                countryName: valEl.text().trim()
                            }
                        );

                        console.log(valEl.attr('value'));
                    }
                });


                return countries;
            }),
            processCountryData = function (d, cb) {
                var countryURL = params.downloadsPath + "/" + d.url,
                    countryCode = d.url.match(/\/(\w\w)\.html/)[1],
                    outputPath = baseOutputPath + "/" + countryCode + ".json";

                parseCountryProfile(countryURL, function (err, data) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    //write the json file out to disk
                    fs.write(outputPath, JSON.stringify(data, null, 2), "w");

                    //console.log('Saved ' + d.countryName + ' profile to:' + outputPath);

                    cb(null, data);
                    //if ((cb) && (countryIdx === results.length - 1)) {
                        //cb('success');
                    //}
                });
            },
            curResultsIdx = 0,
            processCountryDataCallback = function (err, d) {
                if (curResultsIdx < results.length - 1) {
                    curResultsIdx += 1;

                    processCountryData(results[curResultsIdx], processCountryDataCallback);
                } else {
                    callback(null, "success");
                }
            };

        processCountryData(results[0], processCountryDataCallback);
    });
}

function parserCallback(err) {
    "use strict";
    if (err) {
        console.log("FAILED:" + err);
    }

    phantom.exit();
}

//create base output path if it doesn't already exist
if (!fs.exists(countriesBasePath)) {
    if (!fs.makeDirectory(countriesBasePath)) {
        console.error("Failed to create base folder!");
    }
}

//now that the folder is created, open file
parseCountriesList(url, countriesBasePath, parserCallback);


