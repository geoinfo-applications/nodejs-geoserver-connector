"use strict";

var _ = require("underscore");
var expect = require("chai").expect;

var TestUtils = require("../TestUtils.js");
var config = require("../config");

describe("Geoserver functional tests ", function () {

    this.timeout(60 * 1000);

    var testUtils = new TestUtils(config.functional_test);
    var gsRepository = testUtils.gsRepository;

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

        var layer = config.layer;

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

            it("should create non-default datastore in non-default workspace", function (done) {

                gsRepository.createWorkspace(newWorkspace).then(function () {

                    var datastoreConfig = _.extend({}, newDatastore, { workspace: newWorkspace.name });

                    return gsRepository.createDatastore(datastoreConfig).then(function () {
                        return gsRepository.getDatastore(datastoreConfig).then(function (datastore) {
                            expect(datastore.name).to.be.equal(datastoreConfig.name);
                            expect(datastore.workspace.name).to.be.equal(datastoreConfig.workspace);
                            done();
                        });
                    });
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

        });

        describe("styles ", function () {

            var style = config.style;
            var secondStyle = { name: "secondTestStyle", filename: "secondTestStyle.sld" };
            var newWorkspaceStyle = { name: style.name, workspace: newWorkspace.name };
            var existingGlobalStyle = { name: "point" };

            var styleConfig = {
                name: style.name
            };
            var secondStyleConfig = {
                name: secondStyle.name
            };
            var newWorkspaceStyleConfig = _.clone(newWorkspaceStyle);

            before(function (done) {
                testUtils.readStyleContent(function (sldFileContent) {
                    styleConfig.sldBody = sldFileContent;
                    secondStyleConfig.sldBody = sldFileContent;
                    newWorkspaceStyleConfig.sldBody = sldFileContent;
                    done();
                }, done);
            });

            beforeEach(function (done) {
                initializeStyleWorkspace(done);
            });

            afterEach(function (done) {
                return cleanStyleWorkspace(done);
            });

            function initializeStyleWorkspace(done) {
                return cleanStyleWorkspace().then(function () {
                    testUtils.initializeWorkspace(done);
                });
            }

            function cleanStyleWorkspace(done) {
                return gsRepository.deleteGlobalStyle(style).then(function () {
                    return gsRepository.deleteWorkspaceStyle(style).then(function () {
                        return gsRepository.deleteWorkspaceStyle(secondStyle).then(function () {
                            testUtils.cleanWorkspace(done);
                        });
                    });
                });
            }

            function createStyleInNonDefaultWorkspace() {
                return gsRepository.createWorkspace(newWorkspace).then(function () {
                    return gsRepository.createWorkspaceStyle(newWorkspaceStyleConfig);
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

                return gsRepository.createGlobalStyle(styleConfig).then(function () {
                    return gsRepository.getGlobalStyle(style).then(function (layerObject) {
                        expect(layerObject.name).to.be.equal(style.name);
                        done();
                    });
                }).catch(done);
            });

            it("should not return any styles for new workspace", function (done) {

                gsRepository.getWorkspaceStyles().then(function (styles) {
                    expect(styles).to.be.instanceof(Array);
                    expect(styles.length).to.be.equal(0);
                    done();
                }).catch(done);
            });

            it("should fail creating workspace style if style is not supplied", function (done) {

                return gsRepository.createWorkspaceStyle().fail(function (err) {
                    expect(err.message).to.match(/layer name required/);
                    done();
                }).catch(done);
            });

            it("should create a workspace style in a default workspace", function (done) {

                return gsRepository.createWorkspaceStyle(styleConfig).then(function () {
                    return gsRepository.getWorkspaceStyle(style).then(function (styleObject) {
                        expect(styleObject.name).to.be.equal(style.name);
                        done();
                    });
                }).catch(done);
            });

            it("should only upload new SLD file on style create if style already exists in workspace", function (done) {

                return gsRepository.createWorkspaceStyle(styleConfig).then(function () {

                    var styleWithDifferentSLDFileConfig = {
                        name: style.name,
                        sldBody: styleConfig.sldBody
                    };

                    return gsRepository.createWorkspaceStyle(styleWithDifferentSLDFileConfig).then(function () {
                        return gsRepository.getWorkspaceStyle(styleConfig).then(function (styleObject) {
                            expect(styleObject.name).to.be.equal(style.name);
                            done();
                        });
                    });
                }).catch(done);
            });

            it("should delete a workspace style from a default workspace", function (done) {

                return gsRepository.deleteWorkspaceStyle(style).then(function () {
                    return gsRepository.getWorkspaceStyles().then(function (workspaceStyles) {
                        expect(workspaceStyles.length).to.be.equal(0);
                        done();
                    });
                }).catch(done);
            });

            it("should create a workspace style in a non-default workspace", function (done) {

                return createStyleInNonDefaultWorkspace().then(function () {
                    return gsRepository.getWorkspaceStyle(newWorkspaceStyle).then(function (styleObject) {
                        expect(styleObject.name).to.be.equal(newWorkspaceStyle.name);
                        done();
                    });
                }).catch(done);
            });

            it("should delete a workspace style from a non-default workspace", function (done) {

                return createStyleInNonDefaultWorkspace().then(function () {
                    return gsRepository.deleteWorkspaceStyle(newWorkspaceStyle).then(function () {
                        return gsRepository.getWorkspaceStyles().then(function (workspaceStyles) {
                            expect(workspaceStyles.length).to.be.equal(0);
                            done();
                        });
                    });
                }).catch(done);
            });

            it("should get all workspace styles", function (done) {

                return gsRepository.createWorkspaceStyle(styleConfig).then(function () {
                    return gsRepository.createWorkspaceStyle(secondStyleConfig).then(function () {
                        return gsRepository.getWorkspaceStyles().then(function (workspaceStyles) {
                            expect(workspaceStyles.length).to.be.equal(2);
                            expect(workspaceStyles[0].name).to.be.equal(style.name);
                            expect(workspaceStyles[1].name).to.be.equal(secondStyle.name);
                            done();
                        });
                    });
                }).catch(done);
            });

            it("should delete a workspace style", function (done) {

                return gsRepository.createWorkspaceStyle(styleConfig).then(function () {
                    return gsRepository.deleteWorkspaceStyle(style).then(function () {
                        return gsRepository.getWorkspaceStyles().then(function (workspaceStlyes) {
                            expect(workspaceStlyes).to.be.instanceof(Array);
                            expect(workspaceStlyes.length).to.be.equal(0);
                            done();
                        });
                    });
                }).catch(done);
            });

        });

    });
});

