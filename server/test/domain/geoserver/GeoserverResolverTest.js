"use strict";

// eslint-disable-next-line max-statements
describe("Geoserver Resolver unit tests ", () => {

    const _ = require("underscore");
    const util = require("util");
    const expect = require("chai").expect;

    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
    const GeoserverResolver = require("../../../../server/domain/geoserver/GeoserverResolver");

    const config = require("../../config");

    const functionalTestConfig = config.functional_test;
    const geoserverRepository = new GeoserverRepository(functionalTestConfig);
    const geoserverTypes = geoserverRepository.types;
    let resolver;
    createGeoserverResolver();

    const workspaceName = functionalTestConfig.geoserver.workspace;
    const datastoreName = functionalTestConfig.geoserver.datastore;
    const coverageName = "AR_2014";
    const featureTypeName = "testFeatureType";
    const wmsStoreName = "ch";
    const wmsLayerName = "ch.blw.alpprodukte";
    const wmtsStoreName = "at";
    const wmtsLayerName = "at.basis";
    const layerGroupName = "alpprodukte";

    const geoserverTypesConfigs = {
        Workspace: { name: workspaceName },
        Datastore: { name: datastoreName },
        CoverageStore: { name: coverageName },
        Coverage: { name: coverageName, store: coverageName },
        FeatureType: { name: featureTypeName },
        Layer: config.layer,
        Style: config.style,
        WorkspaceStyle: config.style,
        WmsStore: { name: wmsStoreName },
        WmsLayer: { layerName: wmsLayerName, externalWmsService: { name: wmsStoreName } },
        WmtsStore: { name: wmtsStoreName },
        WmtsLayer: { layerName: wmtsLayerName, externalWmtsService: { name: wmtsStoreName } },
        LayerGroup: { name: layerGroupName }
    };

    const getParameters = {
        Workspace: [workspaceName],
        Datastore: [workspaceName, datastoreName],
        CoverageStore: [workspaceName, coverageName],
        Coverage: [workspaceName, coverageName, coverageName],
        FeatureType: [workspaceName, datastoreName, featureTypeName],
        Layer: [workspaceName, config.layer.name],
        Style: [config.style.name],
        WorkspaceStyle: [workspaceName, config.style.name],
        WmsStore: [workspaceName, wmsStoreName],
        WmsLayer: [workspaceName, wmsStoreName, wmsLayerName],
        WmtsStore: [workspaceName, wmtsStoreName],
        WmtsLayer: [workspaceName, wmtsStoreName, wmtsLayerName],
        LayerGroup: [layerGroupName]
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

    beforeEach(() => {
        createGeoserverResolver();
    });

    afterEach(() => {
        tearDownGeoserverResolver();
    });

    it("should contain resolving methods for all geoserver types ", () => {
        _.each(geoserverTypes, (value) => {
            expect(resolver.getResolvers["resolve" + value]).not.to.equal(undefined);
        });
    });

    it("should get correct parameters when only object name is passed", () => {

        _.each(geoserverTypes, (type) => {

            const config = geoserverTypesConfigs[type];

            const resolvedParameters = resolver.getParameters["get" + type + "Parameters"](config);
            const expectedParameters = getParameters[type];

            expect(resolvedParameters).to.be.eql(expectedParameters);
        });
    });

    it("should correctly format urls using format.apply method", () => {

        _.each(geoserverTypes, (type) => {

            const restAPI = resolver.restAPI["get" + type];
            const typeParameters = getParameters[type];

            const formattedUrl = resolver.formatReturnUrl(restAPI, typeParameters);

            const pathTemplate = resolver.baseURL + restAPI;
            const expectedUrl = util.format.apply(null, [pathTemplate].concat(getParameters[type]));

            expect(formattedUrl).to.be.equal(expectedUrl);
        });
    });

    it("should corectly resolve get methods ", () => {

        _.each(geoserverTypes, (type) => {

            const config = geoserverTypesConfigs[type];
            const resolvedUrl = resolver.get(type, config);

            const pathTemplate = resolver.restAPI["get" + type];
            const typeParameters = [pathTemplate].concat(getParameters[type]);

            const expectedPath = util.format.apply(null, typeParameters);
            const expectedUrl = resolver.baseURL + expectedPath;

            expect(expectedUrl).to.be.equal(resolvedUrl);
        });
    });

    it("should corectly resolve delete methods ", () => {

        _.each(geoserverTypes, (type) => {

            const config = geoserverTypesConfigs[type];
            const resolvedUrl = resolver.delete(type, config);

            const pathTemplate = resolver.restAPI["get" + type];
            const typeParameters = [pathTemplate].concat(getParameters[type]);

            const expectedPath = util.format.apply(null, typeParameters);
            const expectedUrl = resolver.baseURL + expectedPath;

            expect(expectedUrl).to.be.equal(resolvedUrl);
        });
    });

    it("should corectly resolve create methods ", () => {

        _.each(geoserverTypes, (type) => {

            const config = geoserverTypesConfigs[type];
            const resolvedUrl = resolver.create(type, config);

            const pathTemplate = resolver.restAPI["get" + type + "s"];

            let urlParameters = getParameters[type];
            if (type === geoserverTypes.LAYER) {
                urlParameters = [];
            } else if ([geoserverTypes.COVERAGESTORE, geoserverTypes.COVERAGE].indexOf(type) < 0) {
                urlParameters.pop();
            }
            const fullParameters = [pathTemplate].concat(urlParameters);

            const expectedPath = util.format.apply(null, fullParameters);
            const expectedUrl = resolver.baseURL + expectedPath;

            expect(expectedUrl).to.be.equal(resolvedUrl);
        });
    });

});
