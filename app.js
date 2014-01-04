/*global require, console, process */
/*jslint plusplus: true */
var exec = require('child_process').exec,
    fs = require('fs'),
    csv = require('ya-csv'),
    phantomjsPath = 'node_modules/phantomjs/lib/phantom/bin/phantomjs',
    rankOrderScript = 'phantomjs/scrapeRankCategoryMappings.js',
    rankOrderInputPath = "data/rankCategoriesMapping.json",
    rankOrderOutputPath = "data/countryRankings.json",
    rankOrderData = [],
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
    };

process.stdout.write("Scraping rank order categories ...");
exec(phantomjsPath  + " " + rankOrderScript, function (error, stdout, stderr) {
    "use strict";
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


