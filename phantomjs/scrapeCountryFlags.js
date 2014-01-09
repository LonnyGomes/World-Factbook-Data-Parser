/*global require, $, phantom, console */
var htmlUrl = "html/factbook/docs/flagsoftheworld.html",
    outputFile = "data/countryFlags.json";

function parseCountryFlagsPage(url, output, callback) {
    "use strict";
    var page = require('webpage').create(),
        fs = require("fs");

    page.open(url, function (status) {
        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open URL:' + url);
            } else {
                console.log('Failed to open URL:' + url);
            }
            phantom.exit();
            return;
        }

        //scan through the various rank categories
        var results = page.evaluate(function () {
            var flagImgs = $(".fotw_li img.fotw"),
                curCountryFlagData,
                flagResults = [];

            
            $.each(flagImgs, function (idx, val) {
                var curData = {},
                    curEl = $(val);
                
                curData.countryName = curEl.attr('countryName');
                curData.countryCode = curEl.attr('countrycode');
                curData.regionCode = curEl.attr('regioncode');
                curData.region = curEl.attr('region');
                curData.flagDesc = curEl.attr('flagdescription');
                curData.flagUrl = curEl.attr('src');
                
                flagResults.push(curData);
            });

            return flagResults;
        });

        //write the json file out to disk
        fs.write(output, JSON.stringify(results), function (err) {
			if (err) {
                return console.log(err);
            }
			console.log('Saved country flags dump to:' + output);
        });

        if (callback) {
            callback('success');
        }

        phantom.exit();
    });
}

//parse country flags html page to generate json data
parseCountryFlagsPage(htmlUrl, outputFile);