/*global require, process, exports, console */
var wget = require("wget");
//var q = require("promised-io/promise");
var q = require("q");

function downloadFiles(urlList, baseOutputPath, callback) {
    "use strict";
    var dl;
}

function downloadFile(url, outputFilename) {
    "use strict";

    var deferred = q.defer(),
        dl = wget.download(url, outputFilename);
    
    console.log("Starting " + outputFilename + " ...");
    dl.on("error", function (err) {
        console.log("Houston, we have a problem");
        deferred.reject(new Error(err));
    });

    dl.on("progress", function (progress) {
        //TODO
    });
    
    dl.on("end", function (output) {
        console.log("DONE");
        deferred.resolve("Download complete");
    });

    //return the promise
    return deferred.promise;
}

exports.downloadFile = downloadFile;