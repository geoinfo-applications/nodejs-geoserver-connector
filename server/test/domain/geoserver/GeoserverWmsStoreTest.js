"use strict";

describe("Geoserver Wms Store Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer, type;
    let wmsStoreConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(async () => {
        wmsStoreConfig = {
            name: "ch",
            label: "CH",
            url: "http://wms.geo.admin.ch",
            username: null,
            password: null
        };

        geoserverConnector = new GeoserverConnector(config.unit_test);

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.isGeoserverRunning.name);
        geoserverConnector.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.initializeWorkspace.name);
        geoserverConnector.initializeWorkspace.returns(Promise.resolve());

        type = geoserverConnector.types.WMSSTORE;
        await geoserverConnector.initializeWorkspace();
    });

    it("should check wms store existance", async () => {
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverConnector.wmsStoreExists(wmsStoreConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, wmsStoreConfig);
        expect(result).to.be.eql(true);
    });

    it("should get wms store", async () => {
        const wmsStoreDetails = { wmsStore: wmsStoreConfig };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmsStoreDetails));
        const getWmsStoreConfig = { name: "ch", workspace: "geoportal" };

        const result = await geoserverConnector.getWmsStore(wmsStoreConfig);

        expect(result).to.be.eql(wmsStoreDetails.wmsStore);
        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, {
            name: getWmsStoreConfig.name,
            workspace: getWmsStoreConfig.workspace
        });
    });

    it("should create wms store", async () => {
        geoserverConnector.wmsStoreExists = sinon.stub().returns(Promise.resolve(false));
        geoserverConnector.issueWmsStoreCreateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverConnector.createWmsStore(wmsStoreConfig);

        expect(geoserverConnector.issueWmsStoreCreateRequest).to.have.been.calledWith(wmsStoreConfig);
    });

    it("should delete wms store", async () => {
        geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        await geoserverConnector.deleteWmsStore(wmsStoreConfig);

        expect(geoserverConnector.deleteGeoserverObject).to.have.been.calledWith(type, wmsStoreConfig);
    });

    it("should return wms store request object", () => {
        const requestObject = geoserverConnector.wmsStoreRequestObject(wmsStoreConfig);

        expect(requestObject).to.be.eql({
            wmsStore: {
                name: wmsStoreConfig.name,
                description: wmsStoreConfig.label,
                type: "WMS",
                enabled: true,
                workspace: {
                    name: wmsStoreConfig.workspace ? wmsStoreConfig.workspace :
                        geoserverConnector.geoserver.workspace
                },
                capabilitiesURL: wmsStoreConfig.url,
                user: wmsStoreConfig.username,
                password: wmsStoreConfig.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        });
    });

});
