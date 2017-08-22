"use strict";

var Utils = require("./util");

function s3Unzip(command){
  Utils.decompress(command);
}

module.exports = s3Unzip;

module.exports.handler = function(event, context, callback) {
  Utils.decompress(event.command);
};
