/*global require, process, exports, console */
var wget = require("wget"),
    q = require("q"),
    path = require("path"),
    fs = require("fs"),
    AdmZip = require('adm-zip'),
    colors = require('colors');

function unzipDump(dumpFilename) {
    "use strict";

    
    var deferred = q.defer(),
        extName = path.extname(dumpFilename),
        outputPath = dumpFilename.replace(new RegExp(extName + "$"), ''),
        zip = new AdmZip(dumpFilename);

	zip.extractAllTo(outputPath);

    return outputPath;
}

function unzipDumps(dumpFilenameList) {
    "use strict";
    
    dumpFilenameList.forEach(function (val) {
        var messageStr = "Extracting " + val + " ... ";
        process.stdout.write(messageStr.bold.white);
        unzipDump(val);
        console.log('done'.green);
    });
    
    return "Unzip complete";
}

function downloadFile(url, outputFilename) {
    "use strict";

    var dl,
        deferred = q.defer(),
        outputPath = path.dirname(outputFilename),
        messageStr = "Downloading " + outputFilename + " ... ";

    //let's make sure the directory exists before going further
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    //start download
    dl = wget.download(url, outputFilename);

    process.stdout.write(messageStr.white.bold);
    dl.on("error", function (err) {
        deferred.reject(new Error(err));
    });

    dl.on("progress", function (progress) {
        //TODO
    });

    dl.on("end", function (output) {
        console.log("done".green);
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
            promise = downloadFile(curUrl, destPath);
        } else {
            promise = promise.then(function (val) {
                return downloadFile(curUrl, destPath);
            });
        }
    });

    return promise;
}

exports.downloadFile = downloadFile;
exports.downloadFiles = downloadFiles;
exports.unzipDumps = unzipDumps;