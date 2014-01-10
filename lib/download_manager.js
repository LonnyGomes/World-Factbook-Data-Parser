/*global require, process, exports, console */
var wget = require("wget");

function downloadFiles(urlList, baseOutputPath, callback) {
    "use strict";
    var dl;
}

function downloadFile(url, outputFilename, callback) {
    "use strict";
    
    var dl = wget.download(url, outputFilename);
    
    dl.on("error", function (err) {
        callback("Failed to download url:" + url);
    });

    dl.on("progress", function (progress) {
        process.stdout.write("*");
    });
    
    dl.on("end", function (output) {
        callback();
    });
}

exports.downloadFile = downloadFile;