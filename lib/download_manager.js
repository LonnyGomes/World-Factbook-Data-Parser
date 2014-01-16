/*global require, process, exports, console */
var wget = require("wget"),
    q = require("q"),
    path = require("path"),
    fs = require("fs"),
    AdmZip = require('adm-zip');

function unzipDump(dumpFilename) {
    "use strict";

    var deferred = q.defer(),
        extName = path.extname(dumpFilename),
        outputPath = dumpFilename.replace(new RegExp(extName + "$"), ''),
        zip = new AdmZip(dumpFilename);

    console.log('OK trying:' + dumpFilename);
//    zip.toBuffer(function (buf) {
//        console.log("SOLVED");
//        deferred.resolve(buf);
//    }, function (err) {
//        console.log("ERR:" + err);
//        deferred.fail(err);
//    });
	
	zip.extractAllTo(outputPath);
    
    return outputPath;
}

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
        deferred.resolve(output);
    });

    //return the promise
    return deferred.promise;
}

function downloadFiles(urlList, baseOutputPath, callback) {
    "use strict";
    var promise = null,
        destPath;

    //loop through URLs and create a promise chain
    urlList.forEach(function (curUrl) {
        destPath =  baseOutputPath + path.sep + path.basename(curUrl);

        if (promise === null) {
            promise = downloadFile(curUrl, destPath).then(function (output) {
                console.log("trying for " + output);
                //return promise.then(unzipDump(output));
                //console.log("file should be fine:" + destPath);
                return unzipDump(output);
            });
        } else {
            console.log("got to second atleat");
            promise = promise
                .then(downloadFile(curUrl, destPath))
                .then(function (output) {
                    //return promise.then(unzipDump(output));
                    //console.log("trying to DL ...");
                    return unzipDump(output);
                });
        }
        
        
    });

    return promise;
}

exports.downloadFile = downloadFile;
exports.downloadFiles = downloadFiles;