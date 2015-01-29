/*global require, $, phantom, console */
/*jslint plusplus: true */
var params = require('../params.json'),
    fs = require("fs"),
    url = params.downloadsPath + '/' + params.index_html,
    countriesBasePath = params.dataPath + '/' + params.countries_path;

function parseCountryProfile(url, callback) {
    "use strict";
    //TODO
    callback(null, {});
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
        });

        //loop through each country and generate country profile dump
        results.forEach(function (val, countryIdx) {
            var countryURL = params.downloadsPath + "/" + val.url,
                countryCode = val.url.match(/\/(\w\w)\.html/)[1],
                outputPath = baseOutputPath + "/" + countryCode + ".json";

            parseCountryProfile(countryURL, function (err, data) {
                //write the json file out to disk
                fs.write(outputPath, JSON.stringify(data, null, 2), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    console.log('Saved ' + val.countryName + ' profile to:' + outputPath);
                });

                if ((callback) && (countryIdx === results.length - 1)) {
                    callback('success');
                }
            });
        });

    });
}

function parserCallback(status) {
    "use strict";
    if (status !== 'success') {
        console.log("FAILED:" + status);
    }

    phantom.exit();
}
console.log("trying " + countriesBasePath);
//create base output path if it doesn't already exist
if (!fs.exists(countriesBasePath)) {
    if (!fs.makeDirectory(countriesBasePath)) {
        console.error("Failed to create base folder!");
    }
}

//now that the folder is created, open file
parseCountriesList(url, countriesBasePath, parserCallback);


