"use strict";

var GeoserverMockServer = require("./test-server.js");
var config = require("./config.js");

var geoserverMockServer = new GeoserverMockServer(config.test.geoserver);