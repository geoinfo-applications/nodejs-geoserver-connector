"use strict";

var fs = require("fs");
var expect = require("chai").expect;

var GeoserverRepository = require("../../../server/domain/geoserver/GeoserverRepository");
var config = require("../config");

describe("Geoserver functional tests ", function () {

    this.timeout(200000);

    var gsRepository;

    var layer = config.layer;
    var style = config.style;

    function createRepository() {
        gsRepository = new GeoserverRepository(config.functional_test);
    }

    function tearDownRepository() {
        gsRepository = null;
    }

    before(function () {
        createRepository();
    });

    after(function () {
        tearDownRepository();
    });

    describe("testing Geoserver access", function () {

        beforeEach(function (done) {
            cleanWorkspace(done);
        });

        afterEach(function (done) {
            cleanWorkspace(done);
        });

        function cleanWorkspace(done) {
            return gsRepository.deleteWorkspace().then(function () {
                done();
            });
        }

        it("GS repository should be disabled if Geoserver instance is not initialized", function (done) {
            expect(gsRepository.isEnabled).to.be.equal(false);
            done();
        });

        it("should correctly fetch Geoserver details upon initialization", function (done) {

            gsRepository.initializeWorkspace().then(function (gsInstance) {
                expect(gsInstance.isEnabled).to.be.equal(true);
                expect(gsInstance.geoserverDetails["@name"]).to.be.equal("GeoServer");
                done();
            }).catch(done);

        });

    });

    describe("Geoserver objects manipulation test", function () {

        var newWorkspace = { name: "newWorkspace" };
        var newDatastore = { name: "newDatastore" };
        var nonExistingLayer = { name: "newLayer" };

        var layer = config.layer;
        var style = config.style;

        beforeEach(function (done) {
            return cleanWorkspace().then(function () {
                return gsRepository.initializeWorkspace().then(function () {
                    done();
                });
            }).catch(function (err) {
                done(err);
            });
        });

        afterEach(function (done) {
            return cleanWorkspace().then(function () {
                done();
            }).catch(function (err) {
                done(err);
            });
        });

        function cleanWorkspace() {
            return gsRepository.deleteWorkspace().then(function () {
                return gsRepository.deleteWorkspace(newWorkspace);
            });
        }

        describe("Geoserver workspaces", function () {

            it("should return false if non-default workspace does not exist ", function (done) {

                gsRepository.workspaceExists(newWorkspace).then(function (exists) {
                    if (exists) {
                        done(new Error("Workspace should not exist in GS workspaces!"));
                    } else {
                        done();
                    }
                }).catch(function (err) {
                    done(err);
                });
            });

            it("should return true if default workspace exists ", function (done) {

                gsRepository.workspaceExists().then(function (exists) {
                    if (exists) {
                        done();
                    } else {
                        done(new Error("Workspace should exist in GS workspaces!"));
                    }
                }).catch(done);
            });

            it("should return true if workspace already exists", function (done) {

                gsRepository.createWorkspace().then(function (result) {
                    expect(result).to.be.true;
                    done();
                }).catch(done);
            });

            it("should delete default GS workspace", function (done) {

                gsRepository.deleteWorkspace().then(function () {
                    done();
                }).catch(done);
            });

            it("should create non-default GS workspace", function (done) {

                gsRepository.createWorkspace(newWorkspace).then(function () {
                    return gsRepository.deleteWorkspace(newWorkspace).then(function () {
                        done();
                    });
                }).catch(done);
            });

        });

        describe("Geoserver datastores", function () {

            it("should return true if default GS datastore exists in default workspace", function (done) {

                gsRepository.datastoreExists().then(function (exists) {
                    if (exists) {
                        done();
                    } else {
                        done(new Error("Datastore should exist in GS workspace!"));
                    }
                }).catch(done);
            });

            it("should delete default GS datastore  in default workspace", function (done) {

                gsRepository.deleteDatastore().then(function () {
                    done();
                }).catch(done);
            });

            it("should return false if non-default GS datastore does not exist in default workspace", function (done) {

                gsRepository.datastoreExists(newDatastore).then(function (exists) {
                    if (exists) {
                        done(new Error("Datastore should not exist in GS workspace!"));
                    } else {
                        done();
                    }
                }).catch(done);
            });

            it("should create non-default GS datastore", function (done) {

                gsRepository.createDatastore(newDatastore).then(function () {
                    done();
                }).catch(done);
            });

        });

        describe("Geoserver layers", function () {

            it("should return false if layer does not exist in default store", function (done) {

                return gsRepository.featureTypeExists(layer).then(function (exists) {
                    if (exists) {
                        done(new Error("Layer should not exist in store!"));
                    } else {
                        done();
                    }
                }).catch(done);
            });

            it("should fail if layer does not exist in flat DB", function (done) {

                return gsRepository.createFeatureType(nonExistingLayer).fail(function (err) {
                    if (err.message === "Trying to create new feature type inside the store, but no attributes were specified") {
                        done();
                    } else {
                        done(new Error(err));
                    }
                }).catch(done);
            });

        });

        describe("Geoserver styles", function () {

            var existingGlobalStyle = { name: "point" };

            it("should return global styles", function (done) {

                gsRepository.getGlobalStyles().then(function (styles) {
                    expect(styles).to.be.instanceof(Array);
                    done();
                }).catch(done);
            });

            it("should get a global style ", function (done) {
                gsRepository.getGlobalStyle(existingGlobalStyle).then(function (styleObject) {
                    expect(styleObject.name).to.be.equal(existingGlobalStyle.name);
                    done();
                }).catch(done);
            });

            it("should create a global style", function (done) {

                fs.readFile(__dirname + "/../data/teststyle.sld", "ascii", function (err, sldContent) {

                    var styleConfig = {
                        name: style.name,
                        sldBody: sldContent
                    };

                    gsRepository.createGlobalStyle(styleConfig).then(function (result) {
                        expect(result).to.be.equal(true);
                        done();
                    }).catch(done);
                });
            });


            it("should not return any styles for new workspace", function (done) {

                gsRepository.getWorkspaceStyles().then(function (styles) {
                    expect(styles).to.be.equal(undefined);
                    done();
                }).catch(done);
            });


        });

    });

});

