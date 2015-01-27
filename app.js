/*global require, console, process */
/*jslint plusplus: true, nomen: true */
var exec = require('child_process').exec,
    fs = require('fs'),
    csv = require('ya-csv'),
    q = require('q'),
    FS = require('q-io/fs'),
    path = require('path'),
    _ = require('underscore'),
    readline = require('readline'),
    colors = require('colors'),
    downloadManager = require('./lib/download_manager'),
    params = require('./params.json'),
    downloadsPath = params.downloadsPath,
    downloadURLs = params.downloadURLs,
    outputBasePath = params.dataPath,
    phantomjsPath = 'node_modules/phantomjs/lib/phantom/bin/phantomjs',
    rankOrderScript = 'phantomjs/scrapeRankCategoryMappings.js',
    rankOrderInputPath = path.resolve(params.dataPath, "rankCategoriesMapping.json"),
    rankOrderOutputPath = path.resolve(params.dataPath, "countryRankings.json"),
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
            sanitizeValue = function (val) {
                //remove any dollar signs or commas
                var ret = val.replace(/[$,]/g, '');

                return isNaN(ret) ? ret.trim() : Number(ret);
            },
            deferred = q.defer();

        reader.addListener('error', function (err) {
            deferred.reject(new Error(err));
        });

        reader.addListener('data', function (data) {
            var d = {
                "rank": data[0],
                "countryName": data[1],
                "rankValue": sanitizeValue(data[2])
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
                return;
            }

            data = JSON.parse(data);

            var idx = 0,
                curPromise,
                total = data.length,
                saveCategoryData = function (obj) {
                    //the category is done being parsed!
                    var categoryObj = {};
                    categoryObj.category = obj.name;
                    categoryObj.categoryData = obj.data;

                    dataResults.push(categoryObj);
                };

            curPromise = data.reduce(function (prev, curItem) {
                return prev.then(function () {
                    return parseCSV(curItem.category, curItem.dataURL, dataResults)
                        .then(saveCategoryData);
                });
            }, q());

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
            } else {
                deferred.resolve("Finished executing " + phantomScript);
            }
        });

        return deferred.promise;
    },
    processPhantomjs = function () {
        'use strict';

        var phantomScripts = [
            [ countryFlagScript, "Processing country flags page"],
            [ rankOrderScript, "Processing rank order page" ]
        ];

        return phantomScripts.reduce(function (prev, curPhantomArgs) {
            var msg = curPhantomArgs[1];
            console.log("    " + msg.bold.white);
            return prev.then(function () {
                return executePhantomjs.apply(this, curPhantomArgs);
            });
        }, q());
    },
    processDumps = function () {
        "use strict";

        console.log("Processing dump files ... ".magenta);
        return processPhantomjs()
            .then(function (val) {
                return processRankOrder(rankOrderInputPath, rankOrderData)
                    .then(function (data) {
                        //save rank order results out to disk
                        FS.write(rankOrderOutputPath, JSON.stringify(data, null, 2)).then(function (val) {
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
            console.log("Successfully downloaded all required data dumps\n".magenta);
            //set up output paths for zip files
            var zipPaths = _.map(downloadURLs, function (curURL) {
                return path.resolve(downloadsPath, path.basename(curURL));
            });
            return downloadManager.unzipDumps(zipPaths);
        });
    },
    prompt = function (dlPath) {
        "use strict";

        var deferred = q.defer(),
            rl,
            promise;

        if (fs.existsSync(dlPath)) {
            promise = deferred.promise;

            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question("Data already exists, would you like to re-download it (y/N)", function (answer) {
                if (answer.match(/y|yes/i)) {
                    console.log("Re-downloading data ...".magenta);
                    download().then(function () {
                        deferred.resolve();
                    }, function (err) {
                        console.error("\nFailed while attempting to re-download: ".red.bold + err.red.bold);
                    });
                } else {
                    deferred.resolve();
                }

                rl.close();
            });

        } else {
            promise = download(); //TODO: pass in vars
        }

        return promise;
    };

//Begin execution of the parsing
(function () {
    "use strict";

    var rl,
        promptVal,
        promise = prompt(downloadsPath);

    promise.then(processDumps)
        .fail(function (err) {
            var errorStr = "\nERROR " + err + "\n";

            console.error(errorStr.red.bold);
        })
        .done();
}());

