/*global require, console, process */
/*jslint plusplus: true, nomen: true */
var exec = require('child_process').exec,
    fs = require('fs'),
    csv = require('ya-csv'),
    q = require('q'),
    FS = require('q-io/fs'),
    path = require('path'),
    _ = require('underscore'),
    colors = require('colors'),
    downloadManager = require('./lib/download_manager'),
    params = require('./params.json'),
    downloadsPath = params.downloadsPath,
    downloadURLs = params.downloadURLs,
    outputBasePath = params.dataPath,
    phantomjsPath = 'node_modules/phantomjs/lib/phantom/bin/phantomjs',
    rankOrderScript = 'phantomjs/scrapeRankCategoryMappings.js',
    rankOrderInputPath = params.dataPath + path.sep + "rankCategoriesMapping.json",
    rankOrderOutputPath = params.dataPath + path.sep + "countryRankings.json",
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

        process.stdout.write("Processing dump files ... ".bold.white);
        return executePhantomjs(countryFlagScript, "Processing country flags page")
            .then(executePhantomjs(rankOrderScript, "Processing rank order page"))
            .then(function (val) {
                return processRankOrder(rankOrderInputPath, rankOrderData)
                    .then(function (data) {
                        //save rank order results out to disk
                        FS.write(rankOrderOutputPath, JSON.stringify(data)).then(function (val) {
                            console.log("done".green);
                            return rankOrderOutputPath;
                        });
                    });
            })
            .fail(function (err) {
                throw new Error("Error processing dumps:" + err);
            });
    },
    download = function () {
        "use strict";

        return downloadManager.downloadFiles(downloadURLs, downloadsPath).then(function (val) {
            console.log("Successfully downloaded all required data dumps".magenta);
            //set up output paths for zip files
            var zipPaths = _.map(downloadURLs, function (curURL) {
                return downloadsPath + path.sep +  path.basename(curURL);
            });
            return downloadManager.unzipDumps(zipPaths);
        });
    };

//Begin execution of the parsing
(function () {
    "use strict";

    var promise = null,
        promptVal;

    if (fs.existsSync(downloadsPath)) {
        process.stdin.write("Data already exists, would you like to re-download it (y/N)?\n");

        //TODO: check if response is yes and then call download manager
    } else {
        promise = download(); //TODO: pass in vars
    }

    if (promise === null) {
        promise = processDumps();
    } else {
        promise.then(function (val) {
            return processDumps();
        });
    }

    promise.fail(function (err) {
        var errorStr = "\nERROR " + err + "\n";

        console.error(errorStr.red.bold);
    })
        .done();
}());


// //start by downloading files
// downloadManager.downloadFiles(downloadURLs, downloadsPath).then(function (val) {
//     "use strict";

//     console.log("Successfully downloaded all required data dumps".magenta);
//      //set up output paths for zip files
//     var zipPaths = _.map(downloadURLs, function (curURL) {
//         return downloadsPath + path.sep +  path.basename(curURL);
//     });
//     return downloadManager.unzipDumps(zipPaths);
// })
//     .then(function (val) {
//         "use strict";
//         return processDumps();
//     })
//     .fail(function (err) {
//         "use strict";
//         var errorStr = "\nERROR " + err + "\n";
//         console.error(errorStr.red.bold);
//     })
//     .done();
