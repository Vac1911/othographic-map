module.exports = {
    geomMap: function (geometry, callback) {
        let nextGeometry = JSON.parse(JSON.stringify(geometry));
        const coordinates = module.exports.hasOwnProperty('coordMap' + geometry.type) ? module.exports['coordMap' + geometry.type](geometry.coordinates, callback) : [];
        return {
            type: geometry.type,
            coordinates: coordinates,
            properties: JSON.parse(JSON.stringify(geometry.properties ?? {}))
        };
    },
    coordMapPoint: function (coordinates, callback) {
        return callback(coordinates);
    },
    coordMapLineString: function (coordinates, callback) {
        return coordinates.map(callback);
    },
    coordMapMultiLineString: function (coordinates, callback) {
        return coordinates.map(lineString => this.coordMapLineString(lineString, callback));
    },
    coordMapPolygon: function (coordinates, callback) {
        return this.coordMapMultiLineString(coordinates, callback);
    },
    coordMapMultiPolygon: function (coordinates, callback) {
        return coordinates.map(lineString => this.coordMapPolygon(lineString, callback));
    },
};
