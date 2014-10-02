"use strict";

var _ = require("underscore");
var qthrottle = require("../qthrottle/Throttle.js");
var expect = require("chai").expect;

var TestUtils = require("../TestUtils.js");
var config = require("../config");

describe("Geoserver functional tests ", function () {

    this.timeout(60 * 1000);

    var testUtils = new TestUtils(config.functional_test);
    var gsRepository = testUtils.gsRepository;

    var layer = config.layer;
    var style = config.style;

    describe("testing access ", function () {

        beforeEach(function (done) {
            testUtils.cleanWorkspace(done);
        });

        afterEach(function (done) {
            testUtils.cleanWorkspace(done);
        });

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

    describe("objects manipulation test ", function () {

        var newWorkspace = testUtils.newWorkspace;
        var newDatastore = testUtils.newDatastore;
        var nonExistingLayer = config.nonExistingLayer;

        beforeEach(function (done) {
            testUtils.initializeWorkspace(done);
        });

        afterEach(function (done) {
            testUtils.cleanWorkspaces(done);
        });

        describe("workspaces ", function () {

            it("should return false if non-default workspace does not exist ", function (done) {

                gsRepository.workspaceExists(newWorkspace).then(function (exists) {
                    if (exists) {
                        done(new Error("Workspace should not exist in GS workspaces!"));
                    } else {
                        done();
                    }
                }).catch(done);
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
                    expect(result).to.be.equal(true);
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

        describe("datastores ", function () {

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

        describe("feature type ", function () {

            it("should return false if feature type does not exist in default store", function (done) {

                return gsRepository.featureTypeExists(layer).then(function (exists) {
                    if (exists) {
                        done(new Error("Layer should not exist in store!"));
                    } else {
                        done();
                    }
                }).catch(done);
            });

            it("should fail if feature type does not exist in flat DB", function (done) {

                return gsRepository.createFeatureType(nonExistingLayer).fail(function (err) {
                    if (err.message === "Trying to create new feature type inside the store," +
                        " but no attributes were specified" ||
                        err.message === ":null" /* database is not accessible */) {
                        done();
                    } else {
                        done(new Error(err));
                    }
                }).catch(done);
            });

            it("should get a layer without workspace prefix", function (done) {

                return gsRepository.get(nonExistingLayer).fail(function (err) {
                    if (err.message === "Trying to create new feature type inside the store," +
                        " but no attributes were specified" ||
                        err.message === ":null" /* database is not accessible */) {
                        done();
                    } else {
                        done(new Error(err));
                    }
                }).catch(done);
            });

        });

        describe("styles ", function () {

            var existingGlobalStyle = { name: "point" };
            var sldContent;

            beforeEach(function (done) {
                testUtils.readStyleContent(function (sldFileContent) {
                    sldContent = sldFileContent;
                    initializeStyleWorkspace(done);
                });
            });

            afterEach(function (done) {
                return cleanStyles(done);
            });

            function initializeStyleWorkspace(done) {
                return cleanStyles().then(function () {
                    testUtils.initializeWorkspace(done);
                });
            }

            function cleanStyles(done) {
                return gsRepository.deleteGlobalStyle(style).then(function () {
                    return gsRepository.deleteWorkspaceStyle(style).then(function () {
                        testUtils.cleanWorkspaces(done);
                    });
                });
            }

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

                var styleConfig = {
                    name: style.name,
                    sldBody: sldContent
                };

                gsRepository.createGlobalStyle(styleConfig).then(function (result) {
                    expect(result).to.be.equal(true);
                    done();
                }).catch(done);
            });

            it("should not return any styles for new workspace", function (done) {

                gsRepository.getWorkspaceStyles().then(function (styles) {
                    expect(styles).to.be.equal(undefined);
                    done();
                }).catch(done);
            });

            it("should create a workspace style", function (done) {

                var styleConfig = {
                    name: style.name,
                    sldBody: sldContent
                };

                gsRepository.createWorkspaceStyle(styleConfig).then(function (result) {
                    expect(result).to.be.equal(true);
                    done();
                }).catch(done);
            });

        });

    });

    describe("test-loading styles create ", function () {

        var sldContent;
        var styleIds = _.range(1, 100);
        // do not set value 1, endless loop
        var throttleValue = 20;

        before(function (done) {
            testUtils.readStyleContent(function (sldFileContent) {
                sldContent = sldFileContent;
                done();
            }, done);
        });

        beforeEach(function (done) {
            initializeStyleWorkspace(done);
        });

        afterEach(function (done) {
            return cleanStyles().then(function () {
                done();
            }).catch(function (err) {
                done(err);
            });
        });

        function initializeStyleWorkspace(done) {
            return cleanStyles().then(function () {
                testUtils.initializeWorkspace(done);
            });
        }

        function cleanStyles() {

            return qthrottle(styleIds, throttleValue, deleteSyle)
                .then(function () {
                    return testUtils.cleanWorkspace();
                });

            function deleteSyle(styleId) {
                var styleConfig = {
                    name: style.name + styleId
                };
                return gsRepository.deleteGlobalStyle(styleConfig);
            }
        }

        it("generating global styles ", function (done) {

            qthrottle(styleIds, throttleValue, createSyle)
                .then(done)
                .catch(function (err) {
                    done(err);
                });

            function createSyle(styleId) {
                var styleConfig = {
                    name: style.name + styleId,
                    sldBody: sldContent
                };
                return gsRepository.createGlobalStyle(styleConfig);
            }
        });

    });

});

