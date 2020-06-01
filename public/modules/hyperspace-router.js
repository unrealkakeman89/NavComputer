var L = require('leaflet')
var helpers = require('@turf/helpers')
var lineString = helpers.lineString
var PathFinder = require('geojson-path-finder')
var findIndex = require('lodash/findIndex')
var Router = {
  pathfinder: {},
  routePathLayer: {},
  planetMarkerPathPoints: [],
  map: {},
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
    var routePath = lineString(path.path, { name: 'path' })
    this.routePathLayer = L.geoJSON(routePath).addTo(this.map)
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
  }
}

module.exports = Router
