"use strict";

var _ = require("underscore");
var util = require("util");
var expect = require("chai").expect;

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var GeoserverResolver = require("../../../../server/domain/geoserver/GeoserverResolver");

var config = require("../../config");

describe("Geoserver Resolver unit tests ", function () {

    this.timeout(500);

    var functionalTestConfig = config.functional_test;
    var geoserverRepository = new GeoserverRepository(functionalTestConfig);
    var geoserverTypes = geoserverRepository.types;
    var resolver;
    createGeoserverResolver();

    var workspaceName = functionalTestConfig.geoserver.workspace;
    var datastoreName = functionalTestConfig.geoserver.datastore;
    var coverageName = "AR_2014";
    var featureTypeName = "testFeatureType";

    var geoserverTypesConfigs = {
        Workspace: { name: workspaceName },
        Datastore: { name: datastoreName },
        CoverageStore: { name: coverageName },
        Coverage: { name: coverageName, store: coverageName },
        FeatureType: { name: featureTypeName },
        Layer: config.layer,
        Style: config.style,
        WorkspaceStyle: config.style
    };

    var getParameters = {
        Workspace: [workspaceName],
        Datastore: [workspaceName, datastoreName],
        CoverageStore: [workspaceName, coverageName],
        Coverage: [workspaceName, coverageName, coverageName],
        FeatureType: [workspaceName, datastoreName, featureTypeName],
        Layer: [workspaceName, config.layer.name],
        Style: [config.style.name],
        WorkspaceStyle: [workspaceName, config.style.name]
    };

    function createGeoserverResolver() {
        resolver = new GeoserverResolver({
            baseURL: geoserverRepository.restURL,
            workspace: geoserverRepository.geoserver.workspace,
            datastore: geoserverRepository.geoserver.datastore
        });
    }

    function tearDownGeoserverResolver() {
        resolver = null;
    }

    beforeEach(function () {
        createGeoserverResolver();
    });

    afterEach(function () {
        tearDownGeoserverResolver();
    });

    it("should contain resolving methods for all geoserver types ", function () {
        _.each(geoserverTypes, function (value) {
            expect(resolver.getResolvers["resolve" + value]).not.to.equal(undefined);
        });
    });

    it("should get correct parameters when only object name is passed", function () {

        _.each(geoserverTypes, function (type) {

            var config = geoserverTypesConfigs[type];

            var resolvedParameters = resolver.getParameters["get" + type + "Parameters"](config);
            var expectedParameters = getParameters[type];

            expect(resolvedParameters).to.be.eql(expectedParameters);
        });
    });

    it("should correctly format urls using format.apply method", function () {

        _.each(geoserverTypes, function (type) {

            var restAPI = resolver.restAPI["get" + type];
            var typeParameters = getParameters[type];

            var formattedUrl = resolver.formatReturnUrl(restAPI, typeParameters);

            var pathTemplate = resolver.baseURL + restAPI;
            var expectedUrl = util.format.apply(null, [pathTemplate].concat(getParameters[type]));

            expect(formattedUrl).to.be.equal(expectedUrl);
        });
    });

    it("should corectly resolve get methods ", function () {

        _.each(geoserverTypes, function (type) {

            var config = geoserverTypesConfigs[type];
            var resolvedUrl = resolver.get(type, config);

            var pathTemplate = resolver.restAPI["get" + type];
            var typeParameters = [pathTemplate].concat(getParameters[type]);

            var expectedPath = util.format.apply(null, typeParameters);
            var expectedUrl = resolver.baseURL + expectedPath;

            expect(expectedUrl).to.be.equal(resolvedUrl);
        });
    });

    it("should corectly resolve delete methods ", function () {

        _.each(geoserverTypes, function (type) {

            var config = geoserverTypesConfigs[type];
            var resolvedUrl = resolver.delete(type, config);

            var pathTemplate = resolver.restAPI["get" + type];
            var typeParameters = [pathTemplate].concat(getParameters[type]);

            var expectedPath = util.format.apply(null, typeParameters);
            var expectedUrl = resolver.baseURL + expectedPath;

            expect(expectedUrl).to.be.equal(resolvedUrl);
        });
    });

    it("should corectly resolve create methods ", function () {

        _.each(geoserverTypes, function (type) {

            var config = geoserverTypesConfigs[type];
            var resolvedUrl = resolver.create(type, config);

            var pathTemplate = resolver.restAPI["get" + type + "s"];
            var urlParameters = getParameters[type];

            if (type === geoserverTypes.LAYER) {
                urlParameters = [];
            } else if ([geoserverTypes.COVERAGESTORE, geoserverTypes.COVERAGE].indexOf(type) < 0) {
                urlParameters.pop();
            }
            var fullParameters = [pathTemplate].concat(urlParameters);

            var expectedPath = util.format.apply(null, fullParameters);
            var expectedUrl = resolver.baseURL + expectedPath;

            expect(expectedUrl).to.be.equal(resolvedUrl);
        });
    });

});
