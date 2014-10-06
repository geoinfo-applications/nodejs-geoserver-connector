"use strict";

var expect = require("chai").expect;

var TestUtils = require("../TestUtils.js");
var config = require("../config");

describe.skip("Geoserver load testing ", function () {

    this.timeout(60 * 1000);

    var testUtils = new TestUtils(config.functional_test);
    var gsRepository = testUtils.gsRepository;

    var style = config.style;

    describe("creating global/workspace styles ", function () {

        var sldContent;
        var numberOfStyles = 100;
        // do not set value 1, endless loop
        var throttleValue = 10;

        before(function (done) {
            testUtils.readStyleContent(function (sldFileContent) {
                sldContent = sldFileContent;
                return testUtils.initializeWorkspace(done);
            }, done);
        });

        beforeEach(function (done) {
            initializeStyleWorkspace(done);
        });

        afterEach(function (done) {
            return testUtils.deleteStyles(style, numberOfStyles).then(function () {
                done();
            }).catch(function (err) {
                done(err);
            });
        });

        function initializeStyleWorkspace(done) {
            return testUtils.deleteStyles(style, numberOfStyles).then(function () {
                testUtils.initializeWorkspace(done);
            });
        }

        it("generating global styles ", function (done) {

            function createSyle(styleId) {
                var styleConfig = {
                    name: style.name + styleId,
                    sldBody: sldContent
                };
                return gsRepository.createGlobalStyle(styleConfig);
            }

            return testUtils.throttleActions(createSyle, numberOfStyles, throttleValue)
                .then(function () {
                    return gsRepository.getGlobalStyles().then(function (globalStyles) {
                        expect(globalStyles.length).to.be.gt(numberOfStyles);
                        done();
                    });
                }).catch(done);
        });

        it("generating workspace styles ", function (done) {

            function createSyle(styleId) {
                var styleConfig = {
                    name: style.name + styleId,
                    sldBody: sldContent
                };
                return gsRepository.createWorkspaceStyle(styleConfig);
            }

            return testUtils.throttleActions(createSyle, numberOfStyles, throttleValue)
                .then(function () {
                    return gsRepository.getWorkspaceStyles().then(function (workspaceStyles) {
                        expect(workspaceStyles.length).to.be.equal(numberOfStyles);
                        done();
                    });
                }).catch(done);
        });

    });

});
