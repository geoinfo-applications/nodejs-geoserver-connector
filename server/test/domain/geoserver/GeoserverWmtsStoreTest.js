"use strict";

describe("Geoserver Wmts Store Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer, type;
    let wmtsStoreConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(async () => {
        wmtsStoreConfig = {
            name: "ch",
            label: "CH",
            url: "http://wmts.geo.admin.ch",
            username: null,
            password: null
        };

        geoserverConnector = new GeoserverConnector(config.unit_test);

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.isGeoserverRunning.name);
        geoserverConnector.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.initializeWorkspace.name);
        geoserverConnector.initializeWorkspace.returns(Promise.resolve());

        type = geoserverConnector.types.WMTSSTORE;
    });

    afterEach(() => {
        geoserverConnector = null;
    });

    it("should check wmts store existance", async () => {
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverConnector.wmtsStoreExists(wmtsStoreConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, wmtsStoreConfig);
        expect(result).to.be.eql(true);
    });

    it("should get wmts store", async () => {
        const wmtsStoreDetails = { wmtsStore: wmtsStoreConfig };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmtsStoreDetails));
        const getWmtsStoreConfig = { name: "ch", workspace: "geoportal" };

        const result = await geoserverConnector.getWmtsStore(wmtsStoreConfig);

        expect(result).to.be.eql(wmtsStoreDetails.wmtsStore);
        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, {
            name: getWmtsStoreConfig.name,
            workspace: getWmtsStoreConfig.workspace
        });
    });

    it("should create wmts store", async () => {
        geoserverConnector.wmtsStoreExists = sinon.stub().returns(Promise.resolve(false));
        geoserverConnector.issueWmtsStoreCreateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverConnector.createWmtsStore(wmtsStoreConfig);

        expect(geoserverConnector.issueWmtsStoreCreateRequest).to.have.been.calledWith(wmtsStoreConfig);
    });

    it("should delete wmts store", async () => {
        geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        await geoserverConnector.deleteWmtsStore(wmtsStoreConfig);

        expect(geoserverConnector.deleteGeoserverObject).to.have.been.calledWith(type, wmtsStoreConfig);
    });

    it("should return wmts store request object", () => {
        const requestObject = geoserverConnector.wmtsStoreRequestObject(wmtsStoreConfig);

        expect(requestObject).to.be.eql({
            wmtsStore: {
                name: wmtsStoreConfig.name,
                description: wmtsStoreConfig.label,
                type: "WMTS",
                enabled: true,
                workspace: {
                    name: wmtsStoreConfig.workspace ? wmtsStoreConfig.workspace :
                        geoserverConnector.geoserver.workspace
                },
                capabilitiesURL: wmtsStoreConfig.url,
                user: wmtsStoreConfig.username,
                password: wmtsStoreConfig.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        });
    });

});
