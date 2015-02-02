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
            var countryData = {},
                getCategoryTextBlock = function (categoryLabel) {
                    return $(".category a:contains('"  + categoryLabel + "')")
                        .parents("tr:first")
                        .next()
                        .find(".category_data")
                        .text();
                },
                getCategoryNestedText = function (categoryLabel, nestedLabel) {
                    return $(".category a:contains('" + categoryLabel + "')")
                        .parents("tr:first")
                        .next()
                        .find("td .category:contains('" + nestedLabel + "') .category_data")
                        .text();

//                    return $(".category a:contains('Area:')").parents("tr:first").next().find("td .category:contains('water:') .category_data").text();
                };

            //Introduction Section
            countryData.background = getCategoryTextBlock("Background");

            //Geography Section
            countryData.geography = {
                location: getCategoryTextBlock("Location"),
                geoCoords: getCategoryTextBlock("Geographic coordinates"),
                area: {
                    total: getCategoryNestedText("Area:", "total:"),
                    land: getCategoryNestedText("Area:", "land:"),
                    water: getCategoryNestedText("Area:", "water:")
                },
                areaCompare: getCategoryTextBlock("Area - comparative:"),
                landBoundaries: getCategoryTextBlock("Land boundaries:"), //TODO: fix see Aruba and China
                coastline: getCategoryTextBlock("Coastline:"),
                //TODO: Maritime claims:
                climate: getCategoryTextBlock("Climate:"),
                terrain: getCategoryTextBlock("Terrain:"),
                elevationLowest: getCategoryNestedText("Elevation extremes:", "lowest point:"),
                elevationHighest: getCategoryNestedText("Elevation extremes:", "highest point:"),
                naturalResources: getCategoryTextBlock("Natural resources:"),
                landUse: {
                    arable: getCategoryNestedText("Land use:", "arable land:"),
                    crops: getCategoryNestedText("Land use:", "permanent crops:"),
                    other: getCategoryNestedText("Land use:", "other:")
                },
                irrigatedLand: getCategoryTextBlock("Irrigated land:"),
                renewableWater: getCategoryTextBlock("Total renewable water resources:"),
                freshWaterWithdrawal: {
                    total: getCategoryNestedText("Freshwater withdrawal (domestic/industrial/agricultural):", "total:"),
                    perCapita: getCategoryNestedText("Freshwater withdrawal (domestic/industrial/agricultural):", "per capita:")
                },
                naturalHazards: getCategoryTextBlock("Natural hazards:"),
                environment: {
                    currIssues: getCategoryTextBlock("Environment - current issues:"),
                    intlAgreements: {
                        partyTo: getCategoryNestedText("Environment - international agreements:", "party to:"),
                        notRatified: getCategoryNestedText("Environment - international agreements:", "signed, but not ratified:")
                    }
                },
                notes: getCategoryTextBlock("Geography - note:")

            };

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
                    }
                });

                return countries;
            }),
            processCountryData = function (d, cb) {
                var countryURL = params.downloadsPath + "/" + d.url,
                    countryName = d.countryName,
                    countryCode = d.url.match(/\/(\w\w)\.html/)[1],
                    outputPath = baseOutputPath + "/" + countryCode + ".json";

                parseCountryProfile(countryURL, function (err, data) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    //add country name & code
                    data.countryName = countryName;
                    data.countryCode = countryCode.toUpperCase();

                    //write the json file out to disk
                    fs.write(outputPath, JSON.stringify(data, null, 2), "w");

                    //console.log('Saved ' + d.countryName + ' profile to:' + outputPath);

                    cb(null, data);
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

//create base output path if it doesn't already exist
if (!fs.exists(countriesBasePath)) {
    if (!fs.makeDirectory(countriesBasePath)) {
        console.error("Failed to create base folder!");
    }
}

//now that the folder is created, open file
parseCountriesList(url, countriesBasePath, function (err) {
    "use strict";
    if (err) {
        console.log("FAILED:" + err);
    }

    phantom.exit();
});


