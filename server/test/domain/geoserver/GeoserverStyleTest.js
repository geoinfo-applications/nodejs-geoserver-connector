"use strict";

describe("Geoserver Styles tests", () => {
    const expect = require("chai").expect;

    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");
    const TestUtils = require("../../TestUtils.js");
    const GeoserverMockServer = require("../../test-server.js");
    const config = require("../../config");


    const testUtils = new TestUtils(config.unit_test);
    let gsConnector = testUtils.gsConnector;

    let geoserverMockServer;

    const layer = config.layer;
    const style = config.style;
    let sldContent;

    before(async () => {
        geoserverMockServer = new GeoserverMockServer();
        geoserverMockServer.addDefaultRequestHandlers();
        await geoserverMockServer.listen();
    });

    after(() => {
        geoserverMockServer.tearDown();
    });

    beforeEach(async () => {
        gsConnector = new GeoserverConnector(config.unit_test);
        await gsConnector.initializeWorkspace();
    });

    afterEach(() => {
        testUtils.tearDownConnector();
    });

    describe("global styles", () => {

        before(async () => {
            sldContent = await testUtils.readStyleContent();
        });

        after(() => {
            sldContent = null;
        });

        it("should fail if global style name is not defined ", async () => {
            try {
                await gsConnector.getGlobalStyle();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should get a global style ", async () => {

            const styleObject = await gsConnector.getGlobalStyle(style);

            expect(styleObject.name).to.be.equal(style.name);
        });

        it("should get all global styles ", async () => {

            const styles = await gsConnector.getGlobalStyles();

            expect(styles).to.be.instanceof(Array);
            expect(styles.length).to.be.equal(4);
            expect(styles[0].name).to.be.equal("point");
        });

        it("should return false if global style name is not defined ", async () => {
            try {
                await gsConnector.createGlobalStyleConfiguration();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should return false if global style does not exist ", async () => {

            const exists = await gsConnector.globalStyleExists({ name: "notExistingStyle" });

            expect(exists).to.be.equal(false);
        });

        it("should return true if global style exist ", async () => {

            const exists = await gsConnector.globalStyleExists(style);

            expect(exists).to.be.equal(true);
        });

        it("should create new global style configuration", async () => {
            await gsConnector.createGlobalStyleConfiguration(style);
        });

        it("should fail uploading global style if name is not defined", async () => {

            try {
                await gsConnector.uploadGlobalStyleContent({ sldBody: "<xml />" });
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }

            throw new Error("should fail");
        });

        it("should fail uploading global style if sld body is not defined", async () => {

            try {
                await gsConnector.uploadGlobalStyleContent(style);
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should fail uploading global style if config is not defined", async () => {
            try {
                await gsConnector.uploadGlobalStyleContent();
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should replace existing global style SLD file", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsConnector.uploadGlobalStyleContent(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should create new global style configuration and upload SLD file content ", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsConnector.createGlobalStyle(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should delete global style", async () => {
            await gsConnector.deleteGlobalStyle(style);
        });

    });

    describe("workspace styles", () => {

        before(async () => {
            sldContent = await testUtils.readStyleContent();
        });

        after(() => {
            sldContent = null;
        });

        it("should fail if workspace style name is not defined", async () => {
            try {
                await gsConnector.getWorkspaceStyle();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should get workspace style ", async () => {

            const workspaceStyle = await gsConnector.getWorkspaceStyle(style);

            expect(workspaceStyle).to.be.instanceof(Object);
            expect(workspaceStyle.name).to.be.equal(style.name);
            expect(workspaceStyle.filename).to.be.equal(style.filename);
        });

        it("should fetch all workspace styles ", async () => {

            const styles = await gsConnector.getWorkspaceStyles();

            expect(styles).to.be.instanceof(Array);
            expect(styles.length).to.be.equal(4);
            expect(styles[0].name).to.be.equal("point");
        });

        it("should return false if workspace style does not exist ", async () => {

            const exists = await gsConnector.workspaceStyleExists({ name: "notExistingStyle" });

            expect(exists).to.be.equal(false);
        });

        it("should return true if workspace style exists ", async () => {

            const exists = await gsConnector.workspaceStyleExists(style);

            expect(exists).to.be.equal(true);
        });

        it("should return false if workspace style name is not defined ", async () => {
            try {
                await gsConnector.createWorkspaceStyleConfiguration();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should create new workspace style ", async () => {
            await gsConnector.createWorkspaceStyleConfiguration(style);
        });

        it("should fail uploading workspace style if name is not defined", async () => {
            try {
                await gsConnector.uploadWorkspaceStyleContent({ sldBody: "<xml />" });
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should fail uploading workspace style if SLD body is not defined", async () => {

            try {
                await gsConnector.uploadWorkspaceStyleContent(style);
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should fail uploading workspace style if config is not defined", async () => {
            try {
                await gsConnector.uploadWorkspaceStyleContent();
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should replace existing workspace style SLD file", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsConnector.uploadWorkspaceStyleContent(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should create new workspace style configuration and upload SLD file content ", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsConnector.createWorkspaceStyle(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should delete workspace style ", async () => {
            await gsConnector.deleteWorkspaceStyle(style);
        });

    });

    describe("layer styles", () => {

        it("should fail if layer name is not defined", async () => {
            try {
                await gsConnector.getLayerStyles();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should get default layer style name", async () => {
            const defaultStyle = await gsConnector.getLayerDefaultStyle(layer);

            expect(defaultStyle.name).to.be.equal(layer.defaultStyleName);
        });

        it("should get all layer styles ", async () => {
            const styles = await gsConnector.getLayerStyles(layer);

            expect(styles).to.be.instanceof(Array);
            expect(styles.length).to.be.equal(4);
            expect(styles[0].name).to.be.equal("point");
        });

        it("should update default layer style ", async () => {
            await gsConnector.setLayerDefaultStyle(layer, style.name);
        });

    });

});
