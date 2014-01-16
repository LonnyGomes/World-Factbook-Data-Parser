/*global require, console, process */
/*jslint plusplus: true, nomen: true */
var exec = require('child_process').exec,
    fs = require('fs'),
    csv = require('ya-csv'),
    q = require('q'),
    FS = require('q-io/fs'),
    path = require('path'),
    _ = require('underscore'),
    downloadManager = require('./lib/download_manager'),
    downloadURLs = [
        "https://www.cia.gov/library/publications/download/download-2013/docs.zip",
        "https://www.cia.gov/library/publications/download/download-2013/rankorder.zip"
    ],
    outputBasePath = "data",
    phantomjsPath = 'node_modules/phantomjs/lib/phantom/bin/phantomjs',
    rankOrderScript = 'phantomjs/scrapeRankCategoryMappings.js',
    rankOrderInputPath = "data/rankCategoriesMapping.json",
    rankOrderOutputPath = "data/countryRankings.json",
    rankOrderData = [],
    countryFlagScript = 'phantomjs/scrapeCountryFlags.js',
    parseCSV = function (categoryName, categoryPath, dataResults) {
        "use strict";
        var arr = [],
            reader = csv.createCsvFileReader(categoryPath, {
                'separator': '\t',
                'quote': '"',
                'escape': '"',
                'comment': ''
            }),
            deferred = q.defer();

        reader.addListener('error', function (err) {
            deferred.reject(new Error(err));
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
            deferred.resolve({
                name: categoryName,
                data: arr
            });
        });

        return deferred.promise;
    },
    processRankOrder = function (jsonInputPath, dataResults) {
        "use strict";
        var deferred = q.defer();
        fs.readFile(jsonInputPath, 'utf8', function (err, data) {
            if (err) {
                deferred.reject(new Error('Failed to open rank categories file: ' + err));
            }

            data = JSON.parse(data);

            var idx = 0,
                curItem,
                curPromise,
                total = data.length,
                saveCategoryData = function (obj) {
                    //the category is done being parsed!
                    var categoryObj = {};
                    categoryObj.category = obj.name;
                    categoryObj.categoryData = obj.data;

                    dataResults.push(categoryObj);
                };

            //chain the parseCSV operations
            while (data.length > 0) {
                curItem = data.shift();
                curPromise = parseCSV(curItem.category, curItem.dataURL, dataResults)
                    .then(saveCategoryData);
            }

            //after we got through the chain, we can resolve the promise
            curPromise.then(function (data) {
                deferred.resolve(dataResults);
            });

        });

        return deferred.promise;
    },
    executePhantomjs = function (phantomScript) {
        "use strict";

        var deferred = q.defer();
        exec(phantomjsPath + " " + phantomScript, function (error, stdout, stderr) {
            if (error) {
                deferred.reject(new Error("Failed to launch phantomjs for " + phantomScript));
            }
            deferred.resolve("Finished executing " + phantomScript);
        });

        return deferred.promise;
    },
    processDumps = function () {
        "use strict";

        process.stdout.write("Processing dump files ... ");
        return executePhantomjs(countryFlagScript, "Processing country flags page")
            .then(executePhantomjs(rankOrderScript, "Processing rank order page"))
            .then(function (val) {
                return processRankOrder(rankOrderInputPath, rankOrderData)
                    .then(function (data) {
                        //save rank order results out to disk
                        FS.write(rankOrderOutputPath, JSON.stringify(data)).then(function (val) {
                            console.log("done");
                            return rankOrderOutputPath;
                        });
                    });
            })
            .fail(function (err) {
                throw new Error("Error processing dumps:" + err);
            });
    };

//start by downloading files
downloadManager.downloadFiles(downloadURLs, outputBasePath).then(function (val) {
    "use strict";

    console.log("Successfully downloaded all required data dumps");
	//set up output paths for zip files
    var zipPaths = _.map(downloadURLs, function (curURL) {
        return outputBasePath + path.sep +  path.basename(curURL);
    });
    return downloadManager.unzipDumps(zipPaths);
})
	.then(function (val) {
        "use strict";
        return processDumps();
    })
    .fail(function (err) {
        "use strict";

        console.error("error!" + err);
    })
    .done();
