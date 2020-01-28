"use strict";


describe("Geoserver LegendGraphic tests", () => {

    const expect = require("chai").expect;
    const _ = require("underscore");

    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
    const TestUtils = require("../../TestUtils.js");
    const config = require("../../config");


    const testUtils = new TestUtils(config.unit_test);
    let gsRepository = testUtils.gsRepository;
    const legend = gsRepository.legend;

    const layer = config.layer;
    const style = config.style;
    const rule = config.rule;
    rule.layer = layer.name;

    const parameters = [
        "REQUEST=GetLegendGraphic",
        "VERSION=1.0.0",
        "FORMAT=" + legend.defaultImageFormat,
        "WIDTH=" + legend.defaultWidth,
        "HEIGHT=" + legend.defaultHeight,
        "LAYER=" + layer.name,
        "TRANSPARENT=true",
        "RULE=" + rule.name
    ];

    const ruleWithoutStyle = _.omit(_.clone(rule), "style");
    const parametersWithStyle = parameters.concat(["STYLE=" + style.name]);

    beforeEach(() => {
        gsRepository = new GeoserverRepository(config.unit_test);
    });

    afterEach(() => {
        testUtils.tearDownRepository();
    });

    describe("rules ", () => {

        it("formatParameters should return valid parameters array for a rule", () => {
            const urlParameters = legend.formatParameters(rule);

            expect(urlParameters).to.be.eql(parametersWithStyle);
        });

        it("getBaseURL should return correct workspace url ", () => {
            const expectedURL = gsRepository.baseURL + legend.defaultWorkspace + "/wms?";

            const baseURL = legend.getBaseURL();

            expect(baseURL).to.be.eql(expectedURL);
        });

        it("getRuleUrl should fail if rule or style name is missing ", () => {
            expect(() => {
                legend.getRuleUrl(ruleWithoutStyle);
            }).to.throw("rule, style and layer name required");
        });

        it("getRuleUrl should return valid getLegendGraphic for rule url ", () => {

            const legendUrl = legend.getRuleUrl(rule);
            const expectedUrl = legend.getBaseURL(rule) + parametersWithStyle.join("&");

            expect(legendUrl).to.be.equal(expectedUrl);
        });

    });

});
