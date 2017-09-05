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

var Utils = require("./util");

function s3Unzip(command, cb){
  if (cb === undefined) {cb = function(err, success) {};}
  var vBucket, vFile;
  if (command.args && command.args.length >= 2) {
    vBucket = command.args[0];
    vFile = command.args[1];
  }
  if (command.bucket) {
    vBucket = command.bucket;
  }
  if (command.file) {
    vFile = command.file;
  }
  Utils.decompress({
    bucket: vBucket,
    file: vFile,
    deleteOnSuccess: command.deleteOnSuccess,
    verbose: command.verbose
  }, cb);
}

module.exports = s3Unzip;

module.exports.handler = function(event, context, callback) {
  if (callback === undefined) {callback = function(err, success) {};}
  Utils.decompress({
    bucket: event.Records[0].s3.bucket.name,
    file: event.Records[0].s3.object.key,
    deleteOnSuccess: true,
    verbose: true
  }, callback);
};
