/*global require, $, phantom, console */
/*jslint plusplus: true */
var params = require('../params.json'),
    url = params.downloadsPath + '/' + params.index_html,
    outputFile = params.dataPath + '/' + params.output_rank_mappings,
    rankOrderURL = params.downloadsPath + '/' + params.rank_order_html;

console.log(params.downloadsPath + '/' + params.rank_order_html);
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
                    //TODO: don't hardcode this path
                    baseURL = 'dumps/rankorder/';

                curElObj.category = curCategory;
                curElObj.url = baseURL + curURL;
                curElObj.dataURL = baseURL + dataURL;

                rankResults.push(curElObj);
            });

            return rankResults;

        });

        //write the json file out to disk
        fs.write(output, JSON.stringify(results, null, 2), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('Saved rank categories dump to:' + output);
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

//parse the rank order values to retrieve the categories and their CSV file mappings
parseRankOrder(rankOrderURL, parserCallback, outputFile);
