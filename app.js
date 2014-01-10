/*global require, console, process */
/*jslint plusplus: true */
var exec = require('child_process').exec,
    fs = require('fs'),
    csv = require('ya-csv'),
    downloadManager = require('./lib/download_manager'),
    phantomjsPath = 'node_modules/phantomjs/lib/phantom/bin/phantomjs',
    rankOrderScript = 'phantomjs/scrapeRankCategoryMappings.js',
    rankOrderInputPath = "data/rankCategoriesMapping.json",
    rankOrderOutputPath = "data/countryRankings.json",
    rankOrderData = [],
    countryFlagScript = 'phantomjs/scrapeCountryFlags.js',
    parseCSV = function (categoryName, categoryPath, dataResults, callback) {
        "use strict";
        var arr = [],
            reader = csv.createCsvFileReader(categoryPath, {
                'separator': '\t',
                'quote': '"',
                'escape': '"',
                'comment': ''
            });
        
        reader.addListener('data', function (data) {
            var d = {
                "rank": data[0],
                "countryName": data[1],
                "rankValue": data[2]
            };
            //console.log(d.rank, d.countryName, d.rankValue);
            arr.push(d);
        });
        
        reader.addListener('end', function (data) {
            if (callback) {
                callback(categoryName, arr);
            }
        });
    },
    processRankOrder = function (jsonInputPath, dataResults, callback) {
		"use strict";
        fs.readFile(jsonInputPath, 'utf8', function (err, data) {
			if (err) {
				console.log('Failed to open rank categories file: ' + err);
				return;
			}

			data = JSON.parse(data);

			var idx = 0,
                curItem,
                total = data.length,
                parseCallback = function (categoryName, data) {
					//the category is done being parsed!
                    var categoryObj = {};
                    categoryObj.category = categoryName;
                    categoryObj.categoryData = data;
                    
                    dataResults.push(categoryObj);
                    
                    if (dataResults.length === total) {
                        //we are done processing, fire the callback
                        if (callback) {
                            callback(dataResults);
                        }
                    }
                };

            for (idx = 0; idx < total; idx++) {
				curItem = data[idx];
                parseCSV(curItem.category, curItem.dataURL, dataResults, parseCallback);
            }
        });
    },
    processDumps = function () {
        "use strict";
        process.stdout.write("Scraping country flags ...");
        exec(phantomjsPath  + " " + countryFlagScript, function (error, stdout, stderr) {
            //"use strict";
            if (error) {
                console.log("Failed to launch phantomjs for country flags!");
                process.exit(1);
            }
            console.log("done");
        });
        
        
        process.stdout.write("Scraping rank order categories ...");
        exec(phantomjsPath  + " " + rankOrderScript, function (error, stdout, stderr) {
            //"use strict";
            if (error) {
                console.log("Failed to launch phantomjs!");
                process.exit(1);
            }
            console.log("done");
            
            processRankOrder(rankOrderInputPath, rankOrderData, function (data) {
                //save rank order results out to disk
                fs.writeFile(rankOrderOutputPath, JSON.stringify(data), function (err) {
                    if (err) {
                        return console.log('Error while trying to save final rank categories JSON:' + err);
                    }
                    console.log('Generated final JSON dump for rank categories: ' + rankOrderOutputPath);
                });
            });
        });
    };

var urls = [
    "https://www.cia.gov/library/publications/download/download-2013/docs.zip",
    "https://www.cia.gov/library/publications/download/download-2013/rankorder.zip"
];
downloadManager.downloadFile(urls[0], "data/docs.zip")
	.then(downloadManager.downloadFile(urls[1], "data/rankorder.zip"))
	.then(function (val) {
        "use strict";
        console.log("Successfully downloaded all required data dumps");
        //now it's safe to process the dumps
        processDumps();
    })
	.fail(function (err) {
        "use strict";
        console.error("OK we fail:" + err);
    })
	.done();
