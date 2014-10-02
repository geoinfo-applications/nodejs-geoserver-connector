"use strict";

var Q = require("q");
var fs = require("fs");

var GeoserverRepository = require("../../server/domain/geoserver/GeoserverRepository");

function TestUtils(config) {

    this.config = config;
    this.gsRepository = new GeoserverRepository(this.config);

    this.newWorkspace = { name: "newWorkspace" };
    this.newDatastore = { name: "newDatastore" };
}

TestUtils.prototype = {

    createRepository: function () {
        this.gsRepository = new GeoserverRepository(this.config);
    },

    tearDownRepository: function () {
        this.gsRepository = null;
    },

    rebuildRepository: function () {
        this.tearDownRepository();
        this.createRepository();
    },

    initializeWorkspace: function (done) {
        this.rebuildRepository();
        this.gsRepository.initializeWorkspace().then(function () {
            done();
        }.bind(this)).catch(done);
    },

    cleanWorkspace: function (done) {
        this.rebuildRepository();
        return this.gsRepository.deleteWorkspace().then(function () {
            this.tearDownRepository();
            if(done){
                done();
            } else {
                return new Q();
            }
        }.bind(this)).catch(done);
    },

    cleanWorkspaces: function (done) {
        this.rebuildRepository();
        return this.gsRepository.deleteWorkspace().then(function () {
            return this.gsRepository.deleteWorkspace(this.newWorkspace).then(function () {
                this.tearDownRepository();
                done();
            }.bind(this));
        }.bind(this)).catch(done);
    },

    readStyleContent: function (callback, done) {
        fs.readFile(__dirname + "/data/teststyle.sld", "ascii", function (err, sldContent) {
            if (err) {
                done(new Error(err));
            }
            callback(sldContent);
        });
    }
};

module.exports = TestUtils;





