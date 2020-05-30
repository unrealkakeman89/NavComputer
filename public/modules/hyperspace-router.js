var L = require('leaflet')
var helpers = require('@turf/helpers')
var lineString = helpers.lineString
var PathFinder = require('geojson-path-finder')

var Router = {
  pathfinder: {},
  routePathLayer: {},
  map: {},
  createPathFinder: function (network, map) {
    this.map = map
    this.pathFinder = new PathFinder(network, { precision: 1e-5 })
    console.log(this.pathFinder)
  },
  createRoute: function (start, finish) {
    this.path = this.pathFinder.findPath(start, finish)
    this.addRouteToMap(this.path)
  },
  addRouteToMap: function (path) {
    this.map.removeLayer(this.routePathLayer)
    var routePath = lineString(path.path, { name: 'path' })
    this.routePathLayer = L.geoJSON(routePath).addTo(this.map)
  }
}

module.exports = Router
