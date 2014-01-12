/*global require, process, exports, console */
var wget = require("wget"),
    q = require("q"),
    path = require("path");


function downloadFile(url, outputFilename) {
    "use strict";

    var deferred = q.defer(),
        dl = wget.download(url, outputFilename);

    console.log("Starting " + outputFilename + " ...");
    dl.on("error", function (err) {
        deferred.reject(new Error(err));
    });

    dl.on("progress", function (progress) {
        //TODO
    });

    dl.on("end", function (output) {
        deferred.resolve("Download complete");
    });

    //return the promise
    return deferred.promise;
}

function downloadFiles(urlList, baseOutputPath, callback) {
    "use strict";
    var promise = null;

    //loop through URLs and create a promise chain
    urlList.forEach(function (curUrl) {
        if (promise === null) {
            promise = downloadFile(curUrl,
                                   baseOutputPath + path.sep +
                                   path.basename(curUrl));
        } else {
            promise = promise.then(
                downloadFile(curUrl,
                             baseOutputPath + path.sep +
                             path.basename(curUrl))
            );
        }
    });

    return promise;
}

exports.downloadFile = downloadFile;
exports.downloadFiles = downloadFiles;