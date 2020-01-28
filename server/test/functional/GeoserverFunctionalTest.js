"use strict";

describe("Geoserver functional tests ", () => {

    const _ = require("underscore");
    const expect = require("chai").expect;

    const TestUtils = require("../TestUtils.js");
    const config = require("../config");

    const testUtils = new TestUtils(config.functional_test);
    const gsRepository = testUtils.gsRepository;

    describe("testing access ", () => {

        beforeEach(async () => {
            await testUtils.cleanWorkspace();
        });

        afterEach(async () => {
            await testUtils.cleanWorkspace();
        });

        it("GS repository should be disabled if Geoserver instance is not initialized", () => {
            expect(gsRepository.isEnabled).to.be.equal(false);
        });

        it("should correctly fetch Geoserver details upon initialization", async () => {

            await gsRepository.initializeWorkspace();

            expect(gsRepository.isEnabled).to.be.equal(true);
            expect(gsRepository.geoserverDetails["@name"]).to.be.equal("GeoServer");
        });

    });

    describe("objects manipulation test ", () => {

        const layer = config.layer;

        const newWorkspace = testUtils.newWorkspace;
        const newDatastore = testUtils.newDatastore;
        const nonExistingLayer = config.nonExistingLayer;

        beforeEach(async () => {
            await testUtils.cleanWorkspace();
            await testUtils.initializeWorkspace();
        });

        afterEach(async () => {
            await testUtils.cleanWorkspace();
        });

        describe("workspaces ", () => {

            it("should return false if non-default workspace does not exist ", async () => {

                const exists = await gsRepository.workspaceExists(newWorkspace);

                expect(!!exists).to.not.be.eql(true, "Workspace should not exist in GS workspaces!");
            });

            it("should return true if default workspace exists ", async () => {

                const exists = await gsRepository.workspaceExists();

                expect(!!exists).to.be.eql(true, "Workspace should exist in GS workspaces!");
            });

            it("should return true if workspace already exists", async () => {

                const result = await gsRepository.createWorkspace();

                expect(!!result).to.be.equal(true);
            });

            it("should delete default GS workspace", async () => {

                await gsRepository.deleteWorkspace();

            });

            it("should create non-default GS workspace", async () => {
                await gsRepository.createWorkspace(newWorkspace);

                await gsRepository.deleteWorkspace(newWorkspace);

            });

        });

        describe("datastores ", () => {

            it("should return true if default GS datastore exists in default workspace", async () => {

                const exists = await gsRepository.datastoreExists();

                expect(!!exists).to.be.eql(true, "Datastore should exist in GS workspace!");
            });

            it("should delete default GS datastore  in default workspace", async () => {

                await gsRepository.deleteDatastore();
            });

            it("should return false if non-default GS datastore does not exist in default workspace", async () => {

                const exists = await gsRepository.datastoreExists(newDatastore);

                expect(!!exists).to.not.be.eql(true, "Datastore should not exist in GS workspace!");
            });

            it("should create non-default GS datastore", async () => {

                await gsRepository.createDatastore(newDatastore);
            });

            it("should create non-default datastore in non-default workspace", async () => {
                await gsRepository.createWorkspace(newWorkspace);
                const datastoreConfig = _.extend({}, newDatastore, { workspace: newWorkspace.name });


                await gsRepository.createDatastore(datastoreConfig);

                const datastore = await gsRepository.getDatastore(datastoreConfig);
                expect(datastore.name).to.be.equal(datastoreConfig.name);
                expect(datastore.workspace.name).to.be.equal(datastoreConfig.workspace);
            });

        });

        describe("feature type ", () => {

            it("should return false if feature type does not exist in default store", async () => {

                const exists = await gsRepository.featureTypeExists(layer);

                expect(!!exists).to.be.eql(false, "feature type should not exist in store!");
            });

            it("should fail if name is not supplied", async () => {

                try {
                    await gsRepository.createFeatureType({});
                } catch (error) {
                    expect(error.message).to.match(/name required/);
                    return;
                }

                throw new Error("should fail");
            });

            it("should fail if feature type does not exist in flat DB", async () => {
                try {
                    await gsRepository.createFeatureType(nonExistingLayer);
                } catch (error) {
                    expect(
                        error === null || /* database is not accessible error = null */
                        error.message === "Trying to create new feature type inside the store, but no attributes were specified"
                    );
                    return;
                }

                throw new Error("Should fail");
            });

        });

        describe("coverages ", () => {

            let coverageStoreConfig;
            const coverageBasePath = "file:///var/lib/tomcat7/webapps/geoserver/data/coverages/";

            beforeEach(() => {
                coverageStoreConfig = {
                    name: "AR_2014",
                    coverageDirectory: coverageBasePath + "pyramid_sample"
                };
            });

            it("should create coverage mosaic store and automatically configure coverage layer ", async () => {
                coverageStoreConfig.coverageStoreType = "imagemosaic";
                coverageStoreConfig.coverageDirectory = coverageBasePath + "mosaic_sample";

                // HINT by default geoserver creates layer named "mosaic"
                await gsRepository.createCoverageStore(coverageStoreConfig);

                const mosaicLayerExists = await gsRepository.layerExists({ name: "mosaic" });
                expect(mosaicLayerExists).to.be.eql(true);
            });

            it("should create coverage pyramid store and automatically configure coverage layer ", async () => {
                coverageStoreConfig.coverageDirectory = coverageBasePath + "pyramid_sample";

                // HINT by default geoserver creates layer named as pyramid directory
                await gsRepository.createCoverageStore(coverageStoreConfig);

                const pyramidLayerExists = await gsRepository.layerExists({ name: "pyramid_sample" });
                expect(pyramidLayerExists).to.be.eql(true);
            });

            it("should create coverage store w/ layer, then update layer parameters ", async () => {
                coverageStoreConfig.coverageStoreType = "imagemosaic";
                coverageStoreConfig.coverageDirectory = coverageBasePath + "mosaic_sample";
                await gsRepository.createCoverageStore(coverageStoreConfig);
                const newConfig = {
                    name: "mosaic",
                    store: coverageStoreConfig.name,
                    updatedConfig: {
                        coverage: {
                            name: "new_name",
                            title: "new_name",
                            enabled: true,
                            parameters: {
                                entry: [
                                    { string: ["AllowMultithreading", false] },
                                    { string: ["MergeBehavior", "FLAT"] },
                                    { string: ["FootprintBehavior", "None"] },
                                    { string: ["Filter", ""] },
                                    { string: ["MaxAllowedTiles", -1] },
                                    { string: ["SORTING", ""] },
                                    { string: ["InputTransparentColor", ""] },
                                    { string: ["OutputTransparentColor", "#FF00FF"] },
                                    { string: ["SUGGESTED_TILE_SIZE", "512,512"] },
                                    { string: ["Accurate resolution computation", false] },
                                    { string: ["USE_JAI_IMAGEREAD", false] },
                                    { string: ["BackgroundValues", ""] }
                                ]
                            }
                        }
                    }
                };
                await gsRepository.updateCoverage(newConfig);

                const mosaicLayerExists = await gsRepository.layerExists({ name: "new_name" });
                expect(mosaicLayerExists).to.be.eql(true);
            });
        });

        // eslint-disable-next-line max-statements
        describe("styles ", () => {

            const style = config.style;
            const secondStyle = { name: "secondTestStyle", filename: "secondTestStyle.sld" };
            const newWorkspaceStyle = { name: style.name, workspace: newWorkspace.name };
            const existingGlobalStyle = { name: "point" };

            const styleConfig = {
                name: style.name
            };
            const secondStyleConfig = {
                name: secondStyle.name
            };
            const newWorkspaceStyleConfig = _.clone(newWorkspaceStyle);

            before(async () => {
                const sldFileContent = await testUtils.readStyleContent();
                styleConfig.sldBody = sldFileContent;
                secondStyleConfig.sldBody = sldFileContent;
                newWorkspaceStyleConfig.sldBody = sldFileContent;
            });

            beforeEach(initializeStyleWorkspace);
            afterEach(cleanStyleWorkspace);

            async function initializeStyleWorkspace() {
                await cleanStyleWorkspace();
                await testUtils.initializeWorkspace();
            }

            async function cleanStyleWorkspace() {
                await gsRepository.deleteGlobalStyle(style);
                await gsRepository.deleteWorkspaceStyle(style);
                await gsRepository.deleteWorkspaceStyle(secondStyle);
                await testUtils.cleanWorkspace();
            }

            async function createStyleInNonDefaultWorkspace() {
                await gsRepository.createWorkspace(newWorkspace);
                return gsRepository.createWorkspaceStyle(newWorkspaceStyleConfig);
            }

            it("should return global styles", async () => {

                const styles = await gsRepository.getGlobalStyles();

                expect(styles).to.be.instanceof(Array);
            });

            it("should get a global style ", async () => {

                const styleObject = await gsRepository.getGlobalStyle(existingGlobalStyle);

                expect(styleObject.name).to.be.equal(existingGlobalStyle.name);
            });

            it("should create a global style", async () => {

                await gsRepository.createGlobalStyle(styleConfig);

                const layerObject = await gsRepository.getGlobalStyle(style);
                expect(layerObject.name).to.be.equal(style.name);
            });

            it("should not return any styles for new workspace", async () => {

                const styles = await gsRepository.getWorkspaceStyles();

                expect(styles).to.be.instanceof(Array);
                expect(styles.length).to.be.equal(0);
            });

            it("should fail creating workspace style if style is not supplied", async () => {

                try {
                    await gsRepository.createWorkspaceStyle();
                } catch (error) {
                    expect(error.message).to.match(/layer name required/);
                    return;
                }

                throw new Error("should fail");
            });

            it("should create a workspace style in a default workspace", async () => {

                await gsRepository.createWorkspaceStyle(styleConfig);

                const styleObject = await gsRepository.getWorkspaceStyle(style);
                expect(styleObject.name).to.be.equal(style.name);
            });

            it("should only upload new SLD file on style create if style already exists in workspace", async () => {
                await gsRepository.createWorkspaceStyle(styleConfig);
                const styleWithDifferentSLDFileConfig = {
                    name: style.name,
                    sldBody: styleConfig.sldBody
                };

                await gsRepository.createWorkspaceStyle(styleWithDifferentSLDFileConfig);

                const styleObject = await gsRepository.getWorkspaceStyle(styleConfig);
                expect(styleObject.name).to.be.equal(style.name);
            });

            it("should delete a workspace style from a default workspace", async () => {

                await gsRepository.deleteWorkspaceStyle(style);

                const workspaceStyles = await gsRepository.getWorkspaceStyles();
                expect(workspaceStyles.length).to.be.equal(0);
            });

            it("should create a workspace style in a non-default workspace", async () => {

                await createStyleInNonDefaultWorkspace();

                const styleObject = await gsRepository.getWorkspaceStyle(newWorkspaceStyle);
                expect(styleObject.name).to.be.equal(newWorkspaceStyle.name);
            });

            it("should delete a workspace style from a non-default workspace", async () => {
                await createStyleInNonDefaultWorkspace();

                await gsRepository.deleteWorkspaceStyle(newWorkspaceStyle);

                const workspaceStyles = await gsRepository.getWorkspaceStyles();
                expect(workspaceStyles.length).to.be.equal(0);
            });

            it("should get all workspace styles", async () => {
                await gsRepository.createWorkspaceStyle(styleConfig);

                await gsRepository.createWorkspaceStyle(secondStyleConfig);

                const workspaceStyles = await gsRepository.getWorkspaceStyles();
                expect(workspaceStyles.length).to.be.equal(2);
                expect(workspaceStyles[0].name).to.be.equal(style.name);
                expect(workspaceStyles[1].name).to.be.equal(secondStyle.name);
            });

            it("should delete a workspace style", async () => {
                await gsRepository.createWorkspaceStyle(styleConfig);

                await gsRepository.deleteWorkspaceStyle(style);

                const workspaceStlyes = await gsRepository.getWorkspaceStyles();
                expect(workspaceStlyes).to.be.instanceof(Array);
                expect(workspaceStlyes.length).to.be.equal(0);
            });
        });

    });
}).timeout(5000);

