var L = require('leaflet')
var helpers = require('@turf/helpers')
var bbox = require('@turf/bbox').default
var nearestPoint = require('@turf/nearest-point').default
var lineString = helpers.lineString
var point = helpers.point
var featureCollection = helpers.featureCollection
// var distance = require('@turf/distance').default

var PathFinder = require('geojson-path-finder')
var findIndex = require('lodash/findIndex')
// var util = require('./util')
// var ItineraryBuilder = require('./itinerary-builder')

var Router = {
  pathfinder: {}, // pathfinder object
  _points: {}, // network vertices
  path: {}, // pathfinder.path (route)
  pathBboxRectangeLayer: {},
  _route: {},
  routePath: {},
  routePathLayer: {}, // leaflet path layer
  planetMarkerPathPoints: [], // planets markers
  map: {}, // leaflet map
  createPathFinder: function (network, map) {
    this.map = map
    this.pathFinder = new PathFinder(network, { precision: 1e-15 })
    var pathfinder = this.pathFinder
    var vertices = this.pathFinder._graph.vertices

    this._points = featureCollection(Object.keys(vertices)
      .filter(function (nodeName) {
        return Object.keys(vertices[nodeName]).length
      })
      .map(function (nodeName) {
        var vertice = pathfinder._graph.sourceVertices[nodeName]
        return point(vertice)
      }))
    console.log('_points array lenght:')
    console.log(this._points.features.length)
  },
  createRoute: function (start, finish) {
    var waypoints = [start, finish]
    console.log(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,waypoints');
    console.log(waypoints);
    var pathfinder = this.pathFinder
    // check if input waypoints are included in the network vertices
    // if not, update the waypoint to the nearest point in the network vertices
    var actualWaypoints = waypoints.map(function (wp) {
      // turf.nearestPoint(targetPoint, points)
      var nearest = nearestPoint(wp, this._points)
      // var lon = nearest.geometry.coordinates[0]
      // var lat = nearest.geometry.coordinates[1]
      // L.marker([lat, lon]).addTo(this.map).bindPopup('actualnearest waypoint').openPopup()
      return nearest
    }.bind(this))

    // create path with actualwaypoints (points in the vertices)
    var legs = actualWaypoints.map(function (wp, i, wps) {
      if (i > 0) {
        return pathfinder.findPath(wps[i - 1], wp)
      }
      return []
    }).slice(1)

    // this.extentToWaypoints = L.geoJSON(coordinates).addTo(this.map)
    this.path = legs[0]
    // this.path = this.pathFinder.findPath(start, finish)
    this.addRouteToMap(this.path)

    // var totalTime = legs.reduce(function (sum, l) { return sum + l.weight }, 0)
    // var totalDistance = legs.reduce(function (sum, l) {
    //   var legDistance = l.path.reduce(function (d, c, i, cs) {
    //     if (i > 0) {
    //       return d + distance(point(cs[i - 1]), point(c)) * 1000
    //     }
    //     return d
    //   }, 0)
    //   return sum + legDistance
    // }, 0)
    // console.log('actualWaypoints');
    // console.log(actualWaypoints);
    // var waypointsLatLongArray = actualWaypoints.map(function (p) {
    //   var latlong = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
    //   return { latLng: latlong }
    // })
    // var inputWaypointsLatLongArray = waypoints.map(function (p) {
    //   var latlong = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
    //   return { latLng: latlong }
    // })
    // this._route = {
    //   name: '',
    //   waypoints: waypointsLatLongArray,
    //   inputWaypoints: inputWaypointsLatLongArray,
    //   summary: {
    //     totalDistance: totalDistance,
    //     totalTime: totalTime
    //   },
    //   coordinates: Array.prototype.concat.apply([], legs.map(function (l) { return l.path.map(util.toLatLng) })),
    //   instructions: []
    // }
    // console.log('this._route')
    // console.log(this._route)
    // var itineraryBuilder = ItineraryBuilder.initialize(this._route)
  },
  addRouteToMap: function (path) {
    this.map.removeLayer(this.routePathLayer)
    this.routePath = lineString(path.path, { name: 'path' })
    this.routePathLayer = L.geoJSON(this.routePath).addTo(this.map)
    this.addBboxRectangle()
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
  },
  routeLayerStyle: {
    missingRouteStyles: [
      { color: 'black', opacity: 0.15, weight: 7 },
      { color: 'white', opacity: 0.6, weight: 4 },
      { color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12' }
    ]
  }
}

module.exports = Router
