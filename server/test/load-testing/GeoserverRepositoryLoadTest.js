"use strict";


describe.skip("Geoserver load testing ", () => {
    const expect = require("chai").expect;

    const TestUtils = require("../TestUtils.js");
    const config = require("../config");

    const testUtils = new TestUtils(config.functional_test);
    const gsConnector = testUtils.gsConnector;

    const style = config.style;

    describe("creating global/workspace styles ", () => {

        let sldContent;
        const numberOfStyles = 100;
        // do not set value 1, endless loop
        const throttleValue = 10;

        before(async () => {
            sldContent = await testUtils.readStyleContent();
            await testUtils.initializeWorkspace();
        });

        beforeEach(async () => {
            await initializeStyleWorkspace();
        });

        afterEach(async () => {
            await testUtils.deleteStyles(style, numberOfStyles);
        });

        async function initializeStyleWorkspace() {
            await testUtils.deleteStyles(style, numberOfStyles);
            await testUtils.initializeWorkspace();
        }

        it("generating global styles ", async () => {

            function createSyle(styleId) {
                const styleConfig = {
                    name: style.name + styleId,
                    sldBody: sldContent
                };
                return gsConnector.createGlobalStyle(styleConfig);
            }

            await testUtils.throttleActions(createSyle, numberOfStyles, throttleValue);

            const globalStyles = await gsConnector.getGlobalStyles();
            expect(globalStyles.length).to.be.gt(numberOfStyles);
        });

        it("generating workspace styles ", async () => {

            function createSyle(styleId) {
                const styleConfig = {
                    name: style.name + styleId,
                    sldBody: sldContent
                };
                return gsConnector.createWorkspaceStyle(styleConfig);
            }

            await testUtils.throttleActions(createSyle, numberOfStyles, throttleValue);

            const workspaceStyles = await gsConnector.getWorkspaceStyles();
            expect(workspaceStyles.length).to.be.equal(numberOfStyles);
        });

    });

}).timeout(60 * 1000);
