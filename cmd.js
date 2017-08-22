"use strict";

const AWS = require("aws-sdk");
var s3 = new AWS.S3();
const AdmZip = require("adm-zip");
const fs = require("fs");
const dateTime = require("date-time");
const md5 = require("md5");
const command = require("commander");


command
  .version("0.1.0")
  .usage("[options] <bucket name> <filename>")
  .option("-b --bucket <name>", "S3 bucket name")
  .option("-f --file <name>", "Filename of the zip file (including extension)")
  .parse(process.argv);


if (!command.bucket || !command.file) {
  console.log("Error: missing either bucket name or full filename!");
  process.exit(1);
}

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

      //for each file in the zip, decompress and upload it to S3; once all are uploaded, delete the tmp zip
      var counter = 0;
    	zipEntries.forEach(function(zipEntry) {
        s3.upload({ Bucket: command.bucket, Key: zipEntry.entryName, Body: zipEntry.getData() }, function(err, data) {
          counter++;
          if (err) console.log(err);
          else console.log("File decompressed to S3: "+data.Location);
          if (zipEntryCount === counter){
            fs.unlinkSync("/tmp/"+tmpZipFilename+".zip");
          }
        });
    	});
    }
  }
);
