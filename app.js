/*global require, $, phantom, console */
/*jslint plusplus: true */
//var jQueryURL = "html/js/jquery-2.0.3.min.js";
var url = 'html/factbook/index.html',
    rankOrderURL = 'html/factbook/rankorder/rankorderguide.html',
    jQueryURL = 'http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js';
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

function parseRankOrder(url, callback) {
    "use strict";
    var page = require('webpage').create(),
        parseRankCSV = function (rankPathname, categoryName, cb) {
//            if (status !== 'success') {
//                if (callback !== undefined) {
//                    callback('Failed to open rank order URL:' + url);
//                }
//                return;
//            }
            console.log("blah:" + categoryName);
            
        };

    page.open(url, function (status) {
        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open rank order base URL:' + url);
            }
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

                //curCategory = curTopicEl.text();
                //curURL = curTopicEl.attr('href');
                
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

        var curResObj,
            resIdx,
            rankPage;
        //loop through 
        for (resIdx = 0; resIdx < results.length; resIdx++) {
            curResObj = results[resIdx];

            parseRankCSV(curResObj.dataURL, curResObj.category);

        }

        console.log("RESULTS NAME:" + results[0].category);
        console.log("RESULTS URL:" + results[0].dataURL);

        if (callback) {
            callback('success');
        }
    });
}

function parserCallback(status) {
    "use strict";
    if (status !== 'success') {
        console.log("FAILED:" + status);
        phantom.exit();
    }
}
//
///
parseRankOrder(rankOrderURL, parserCallback);
