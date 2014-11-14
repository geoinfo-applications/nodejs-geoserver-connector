"use strict";

var expect = require("chai").expect;

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var TestUtils = require("../../TestUtils.js");
var GeoserverMockServer = require("../../test-server.js");
var config = require("../../config");

describe("Geoserver repository unit tests", function () {

    this.timeout(500);

    var testUtils = new TestUtils(config.unit_test);
    var gsRepository = testUtils.gsRepository;

    var geoserverMockServer;

    describe("testing offline Geoserver handling ", function () {

        before(function (done) {
            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addTimeoutRequestHandler();
            geoserverMockServer.listen(done);
        });

        beforeEach(function () {
            testUtils.createRepository();
        });

        afterEach(function () {
            testUtils.tearDownRepository();
        });

        after(function () {
            geoserverMockServer.tearDown();
        });

        it("repository should be disabled if Geoserver instance is not initialized ", function (done) {
            expect(gsRepository.isEnabled).not.to.be.equal(true);
            done();
        });

        it("should handle repository initialization timeout ", function (done) {

            gsRepository.dispatcher.timeout = 1;

            gsRepository.initializeWorkspace().then(function () {
                done(new Error("repository shouldn't be initialized "));
            }).catch(function (err) {
                expect(gsRepository.isEnabled).to.be.equal(false);
                expect(err.message).to.match(/ETIMEDOUT/);
                done();
            });
        });
    });

    describe("testing online Geoserver access", function () {

        var layer = config.layer;
        var nonExistingLayer = config.nonExistingLayer;

        before(function (done) {
            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addDefaultRequestHandlers();
            geoserverMockServer.listen(done);
        });

        beforeEach(function () {
            gsRepository = new GeoserverRepository(config.unit_test);
        });

        afterEach(function () {
            testUtils.tearDownRepository();
        });

        after(function () {
            geoserverMockServer.tearDown();
        });

        describe("testing Geoserver config", function () {

            it("should correctly add admin path to baseUrl if supplied", function () {

                var gsConfig = config.unit_test.geoserver;
                var expectedAdminUrl = "http://" + gsConfig.host + ":" + gsConfig.port + "/" +
                    gsConfig.context + "/" + gsConfig.adminPath + "/";

                expect(gsRepository.baseURL).to.be.equal(expectedAdminUrl);
            });
        });

        describe("testing Geoserver access functionalites", function () {

            it("should correctly fetch Geoserver details", function (done) {

                gsRepository.isGeoserverRunning().then(function () {
                    expect(gsRepository.isEnabled).to.be.equal(true);
                    done();
                }).catch(done);
            });

            it("should correctly initialize new Geoserver instance", function (done) {

                gsRepository.initializeWorkspace().then(function () {
                    expect(gsRepository.isEnabled).to.be.equal(true);
                    expect(gsRepository.geoserverDetails["@name"]).to.be.equal("GeoServer");
                    done();
                }).catch(done);
            });

            it("should reload catalog", function (done) {

                gsRepository.reloadCatalog().then(function () {
                    done();
                }).catch(done);
            });

            it("should reset cache", function (done) {

                gsRepository.resetCache().then(function () {
                    done();
                }).catch(done);
            });
        });

        describe("testing Geoserver CRUD methods", function () {

            beforeEach(function (done) {
                gsRepository = new GeoserverRepository(config.unit_test);
                gsRepository.initializeWorkspace().then(function () {
                    done();
                });
            });

            it("should fetch workspace ", function (done) {

                gsRepository.workspaceExists().then(function () {
                    done();
                }).catch(done);
            });

            it("should fetch datastore ", function (done) {

                gsRepository.datastoreExists().then(function () {
                    done();
                }).catch(done);
            });

            it("should return true if feature type exists", function (done) {

                gsRepository.featureTypeExists(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should get feature type details ", function (done) {

                gsRepository.getFeatureType(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should delete feature type ", function (done) {

                gsRepository.deleteFeatureType(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should fail renaming feature type if new name is not supplied ", function (done) {

                gsRepository.renameFeatureType(layer).catch(function (error) {
                    expect(error.message).to.match(/name required/);
                    done();
                });
            });

            it("should rename feature type ", function (done) {

                gsRepository.renameFeatureType(layer, "newLayerName").then(function () {
                    done();
                }).catch(done);
            });

            it("should recalculate feature type BBOX ", function (done) {
                return gsRepository.recalculateFeatureTypeBBox(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should get layer details using /layers/layerName format", function (done) {

                gsRepository.getLayer(layer).then(function (layerDetails) {
                    expect(layerDetails.name).to.be.equal(layer.name);
                    done();
                }).catch(done);
            });

            it("should get layer details using /layers/workspace:layerName format ", function (done) {

                var layerWithWorkspace = { name: layer.name, wsName: "testWorkspace:" };

                gsRepository.getLayer(layerWithWorkspace).then(function (layerDetails) {
                    expect(layerDetails.name).to.be.equal(layer.name);
                    done();
                }).catch(done);
            });

            it("should return false if layer does not exist ", function (done) {

                gsRepository.layerExists(nonExistingLayer).then(function (exists) {
                    expect(exists).to.be.equal(false);
                    done();
                }).catch(done);
            });

            it("should return true if layer exist ", function (done) {

                gsRepository.layerExists(layer).then(function (exists) {
                    expect(exists).to.be.equal(true);
                    done();
                }).catch(done);
            });

        });

    });

});
