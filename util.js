/*
Copyright (c) 2017 Steve Yardumian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
"use strict";

var AWS = require("aws-sdk");
var s3 = new AWS.S3();
var AdmZip = require("adm-zip");
var fs = require("fs");
var dateTime = require("date-time");
var md5 = require("md5");

module.exports.decompress = function(/*String*/command, /*Function*/ cb) {

  if (!command.bucket || !command.file) {
    console.log("Error: missing either bucket name or full filename!");
    process.exit(1);
  }

  //TODO:check that unzipped folder doesn't already exist

  s3.getObject(
    {
      Bucket: command.bucket,
      Key: command.file
    }, function(err, data) {
      if (err) {
       	console.log(err, err.stack);
       	process.exit(1);
      }
      else {
       	console.log("Zip file found in S3 bucket!");

        //check that file in that location is a zip, otherwise throw error and exit
       	if (data.ContentType !== "application/zip") {
       		console.log("Error: file is not of type zip. Please select a valid file (filename.zip).");
       		process.exit(1);
       	}

       	 //check that file is < 20mb, otherwise throw error and exit
       	if (data.ContentLength > 20971520) {
       		console.log("Error: the file selected is > 20 MB. Please select a valid file that is < 20 MB.");
       		process.exit(1);
        }

        //write the zip file locally in a tmp dir
        var tmpZipFilename = md5(dateTime());
        fs.writeFileSync("/tmp/"+tmpZipFilename+".zip", data.Body);

        //find all files in the zip and the count of them
        var zip = new AdmZip("/tmp/"+tmpZipFilename+".zip");
      	var zipEntries = zip.getEntries();
        var zipEntryCount = Object.keys(zipEntries).length;

        if (zipEntryCount === 0){
          cb(new Error("Error: the zip file was empty!"));
          process.exit(1);
        }

        //for each file in the zip, decompress and upload it to S3; once all are uploaded, delete the tmp zip
        var counter = 0;
      	zipEntries.forEach(function(zipEntry) {
          s3.upload({ Bucket: command.bucket, Key: zipEntry.entryName, Body: zipEntry.getData() }, function(err, data) {
            counter++;
            if (err) console.log(err);
            else console.log("File decompressed to S3: "+data.Location);
            if (zipEntryCount === counter){
              fs.unlinkSync("/tmp/"+tmpZipFilename+".zip");
              cb(null, "Success!");
            }
          });
      	});
      }
    }
  );
}
