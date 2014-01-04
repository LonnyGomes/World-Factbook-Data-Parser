/*global require, $, phantom, console */
/*jslint plusplus: true */
var url = 'html/factbook/index.html',
    outputFile = "data/rankCategories.json",
    rankOrderURL = 'html/factbook/rankorder/rankorderguide.html';
/*
var page = require('webpage').create();
page.open(url, function(status) {
    if (status !== 'success') {
        console.log("Failed to open: " + url);
        phantom.exit();
    }

    page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js', function(jsStatus) {
        console.log("trying ... " + jsStatus );
        var title = page.evaluate(function() {
            
            return document.title;
        });
        console.log("page title:" + title);
        phantom.exit();
    });

});

*/

function parseRankOrder(url, callback, output) {
    "use strict";
    var page = require('webpage').create(),
        fs = require("fs");

    page.open(url, function (status) {
        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open rank order base URL:' + url);
            }
            phantom.exit();
            return;
        }


        //scan through the various rank categories
        var results = page.evaluate(function () {
            var rankTopics = $('.answer a'),
                curCategory,
                curURL,
                curTopicEl,
                rankResults = [];

            
            $.each(rankTopics, function (idx, val) {
                var curElObj = {},
                    valEl = $(val),
                    curCategory = valEl.text().replace(/:$/, ""),
                    curURL = valEl.attr('href').replace(/[\w\W]*\//, ""),
                    dataURL = 'rawdata_' + curURL.replace(/rank\.html/, ".txt"),
                    baseURL = 'html/factbook/rankorder/';

                curElObj.category = curCategory;
                //TODO: don't hardcode this path
                curElObj.url = baseURL + curURL;
                curElObj.dataURL = baseURL + dataURL;

                rankResults.push(curElObj);
            });

            return rankResults;
            
        });

        //write the json file out to disk
        fs.write(output, JSON.stringify(results), function (err) {
			if (err) {
                return console.log(err);
            }
			console.log('Hello World > helloworld.txt');
        });

        if (callback) {
            callback('success');
        }

        phantom.exit();
    });
}

function parserCallback(status) {
    "use strict";
    if (status !== 'success') {
        console.log("FAILED:" + status);
        phantom.exit();
    }
}

parseRankOrder(rankOrderURL, parserCallback, outputFile);
