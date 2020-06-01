var L = require('leaflet')
var helpers = require('@turf/helpers')
var bbox = require('@turf/bbox').default
var lineString = helpers.lineString
var PathFinder = require('geojson-path-finder')
var findIndex = require('lodash/findIndex')
var Router = {
  pathfinder: {}, // pathfinder object
  path: {}, // pathfinder.path
  pathBboxRectangeLayer: {},
  routePath: {},
  routePathLayer: {}, // leaflet path layer
  planetMarkerPathPoints: [], // planets markers
  map: {}, // leaflet map
  createPathFinder: function (network, map) {
    this.map = map
    this.pathFinder = new PathFinder(network, { precision: 1e-5 })
  },
  createRoute: function (start, finish) {
    this.path = this.pathFinder.findPath(start, finish)
    this.addRouteToMap(this.path)
  },
  addRouteToMap: function (path) {
    this.map.removeLayer(this.routePathLayer)
    this.routePath = lineString(path.path, { name: 'path' })
    this.routePathLayer = L.geoJSON(this.routePath).addTo(this.map)
    this.addBboxRectangle()
    // this.map.getBoundsZoom(this.routePathLayer.getBounds())
  },
  addPlanetMarker: function (id, feature) {
    var lon = feature.geometry.coordinates[0]
    var lat = feature.geometry.coordinates[1]
    var planetMarker = L.marker([lat, lon]).addTo(this.map).bindPopup(feature.properties.name).openPopup()
    this.planetMarkerPathPoints.push({ id: id, marker: planetMarker })
  },
  removePlanetMarker: function (id) {
    var markersArray = this.planetMarkerPathPoints
    var markerIndex = findIndex(markersArray, function (o) { return o.id === id })
    var marker = this.planetMarkerPathPoints[markerIndex].marker
    this.map.removeLayer(marker)
  },
  addBboxRectangle: function () {
    this.map.removeLayer(this.pathBboxRectangeLayer)
    var pathBbox = bbox(this.routePath)
    var m = 10 // bbox margin
    var bounds = L.latLngBounds([pathBbox[1] - m, pathBbox[0] - m], [pathBbox[3] + m, pathBbox[2] + m])
    this.map.fitBounds(bounds)
    var rectangeProperties = { color: 'orange', weight: 1, fillOpacity: 0.03, interactive: false }
    this.pathBboxRectangeLayer = L.rectangle(bounds, rectangeProperties).addTo(this.map)
  }
}

module.exports = Router
