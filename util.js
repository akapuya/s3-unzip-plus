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

var decompress = function(/*String*/command, /*Function*/ cb) {

  if (!command.bucket || !command.file) {
    if (cb) cb(new Error("Error: missing either bucket name or full filename!"));
    else console.log("Error: missing either bucket name or full filename!");
    process.exit(1);
  }

  var filenamePartsArray = command.file.split(".");
  var foldername = filenamePartsArray[0];

  s3.getObject(
    {
      Bucket: command.bucket,
      Key: foldername+"/"
    }, function(err1, data1) {
      if (data1) {
        //TODO: if called via command line, ask here to overwrite the data and prompt for response
        //console.log("Folder '"+foldername+"' already exists!");
      }

      s3.getObject(
        {
          Bucket: command.bucket,
          Key: command.file
        }, function(err2, data2) {
          if (err2) {
           	if (cb) cb(new Error("File Error: "+err2));
            else console.log("File Error: "+err2);
            process.exit(1);
          }
          else {
           	//console.log("Zip file '"+command.file+"' found in S3 bucket!");

            //check that file in that location is a zip content type, otherwise throw error and exit
           	if (data2.ContentType !== "application/zip") {
           		if (cb) cb(new Error("Error: file is not of type zip. Please select a valid file (filename.zip)."));
              else console.log("Error: file is not of type zip. Please select a valid file (filename.zip).");
              process.exit(1);
           	}
    /*
            //check that file is < 20mb, otherwise throw error and exit
           	if (data2.ContentLength > 20971520) {
           		console.log("Error: the file selected is > 20 MB. Please select a valid file that is < 20 MB.");
           		process.exit(1);
            }
    */
            //write the zip file locally in a tmp dir
            var tmpZipFilename = md5(dateTime());
            fs.writeFileSync("/tmp/"+tmpZipFilename+".zip", data2.Body);

            //find all files in the zip and the count of them
            var zip = new AdmZip("/tmp/"+tmpZipFilename+".zip");
          	var zipEntries = zip.getEntries();
            var zipEntryCount = Object.keys(zipEntries).length;

            //if no files found in the zip
            if (zipEntryCount === 0){
              if (cb) cb(new Error("Error: the zip file was empty!"));
              else console.log("Error: the zip file was empty!");
              fs.unlinkSync("/tmp/"+tmpZipFilename+".zip");
              process.exit(1);
            }

            //for each file in the zip, decompress and upload it to S3; once all are uploaded, delete the tmp zip and zip on S3
            var counter = 0;
          	zipEntries.forEach(function(zipEntry) {
              s3.upload({ Bucket: command.bucket, Key: zipEntry.entryName, Body: zipEntry.getData() }, function(err3, data3) {
                counter++;

                if (err3) {
                  if (cb) cb(new Error("Upload Error: "+err3));
                  else console.log(err3);
                  fs.unlinkSync("/tmp/"+tmpZipFilename+".zip");
                  process.exit(1);
                }
                else {
                  //console.log("File decompressed to S3: "+data3.Location);
                }

                //if all files are unzipped...
                if (zipEntryCount === counter){
                  //delete the tmp (local) zip file
                  fs.unlinkSync("/tmp/"+tmpZipFilename+".zip");

                  //console.log("Local temp zip file deleted.");

                  //delete the zip file up on S3
                  s3.deleteObject({Bucket: command.bucket, Key: command.file}, function(err4, data4) {
                    if (err4) {
                      if (cb) cb(new Error(err4));
                      else console.log(err4);
                      process.exit(1);
                    }
                    else {
                      //console.log("S3 file '"+command.file+"' deleted.");
                    }

                    //WE GOT TO THE END
                    cb(null, "Success!");
                  });
                }

              });
          	});
          }
        }
      );
    }
  );
}

module.exports = {
  decompress: decompress
}
