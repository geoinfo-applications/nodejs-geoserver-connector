"use strict";

// eslint-disable-next-line max-statements
describe("Geoserver Layer Group Test ", () => {

    const _ = require("underscore");
    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer, type;
    let layerGroupConfig, allLayerNames;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(() => {
        layerGroupConfig = {
            id: 227,
            name: "alpprodukte",
            label: "Alpprodukte",
            layerNames: "ch.blw.alpprodukte",
            externalWmsService: {
                id: 45,
                name: "ch",
                label: "ch",
                url: "http://wms.geo.admin.ch",
                username: null,
                password: null
            }
        };

        allLayerNames = ["ch.blw.alpprodukte", "ch.blw.bergprodukte"];

        geoserverConnector = new GeoserverConnector(config.unit_test);

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.isGeoserverRunning.name);
        geoserverConnector.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.initializeWorkspace.name);
        geoserverConnector.initializeWorkspace.returns(Promise.resolve());

        type = geoserverConnector.types.LAYERGROUP;
    });

    it("should check wms layer existance", async () => {
        geoserverConnector.geoserverObjectExists = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverConnector.layerGroupExists(layerGroupConfig);

        expect(geoserverConnector.geoserverObjectExists).to.have.been.calledWith(type, layerGroupConfig);
        expect(result).to.be.eql(true);
    });

    it("should get layer group", async () => {
        const layerGroupDetails = { layerGroup: layerGroupConfig };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(layerGroupDetails));

        const result = await geoserverConnector.getLayerGroup(layerGroupConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, layerGroupConfig);
        expect(result).to.be.eql(layerGroupDetails);
    });

    it("should return layer group request object", () => {

        const layerGroupRequestObject = geoserverConnector.layerGroupRequestObject(layerGroupConfig, allLayerNames);

        expect(layerGroupRequestObject).to.have.all.keys("layerGroup", "srs", "projectionPolicy");
        expect(layerGroupRequestObject.layerGroup).to.have.all.keys("name", "title", "layers", "styles");
        expect(layerGroupRequestObject.layerGroup.name).to.be.eql("alpprodukte");
        expect(layerGroupRequestObject.layerGroup.title).to.be.eql("Alpprodukte");
        expect(layerGroupRequestObject.layerGroup.layers.layer.length).to.be.eql(2);
        expect(layerGroupRequestObject.layerGroup.layers.layer[0]).to.be.eql({ enabled: true, name: "ch.blw.alpprodukte" });
        expect(layerGroupRequestObject.layerGroup.styles.style[0]).to.be.eql("");
    });

    describe("resolver", () => {

        beforeEach(() => {
            layerGroupConfig.layerName = "alpprodukte";
        });

        it("should return correct url create", () => {
            const correctCreateUrl = geoserverConnector.resolver.create(type, layerGroupConfig).split(["/"]);

            expect(_.contains(correctCreateUrl, "layergroups")).to.be.eql(true);
        });

        it("should return correct url with get", () => {
            const correctGetUrl = geoserverConnector.resolver.get(type, layerGroupConfig).split(["/"]);

            expect(_.contains(correctGetUrl, "layergroups")).to.be.eql(true);
            expect(_.contains(correctGetUrl, "alpprodukte")).to.be.eql(true);
        });
    });

    describe("create layer group", () => {

        beforeEach(() => {
            layerGroupConfig.layerName = "alpprodukte";
            geoserverConnector.layerGroupExists = sinon.stub();
            geoserverConnector.issueLayerGroupCreateRequest = sinon.stub();
        });

        it("should create new layer group", async () => {
            geoserverConnector.layerGroupExists.returns(Promise.resolve(false));

            await geoserverConnector.createLayerGroup(layerGroupConfig, allLayerNames);

            expect(geoserverConnector.issueLayerGroupCreateRequest).callCount(1);
        });

        it("should not create new layer group", async () => {
            geoserverConnector.layerGroupExists.returns(Promise.resolve(true));

            try {
                await geoserverConnector.createLayerGroup(layerGroupConfig, allLayerNames);
            } catch (error) {
                expect(error).to.match(/already exists/);
                return;
            }
            throw new Error("should fail");
        });
    });
});
