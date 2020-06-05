var L = require('leaflet')
var $ = require('jquery')

var helpers = require('@turf/helpers')
var bbox = require('@turf/bbox').default
var nearestPoint = require('@turf/nearest-point').default
var lineString = helpers.lineString
var point = helpers.point
var featureCollection = helpers.featureCollection
var distance = require('@turf/distance').default
var PathFinder = require('geojson-path-finder')
// var _ = require('lodash')
var last = require('lodash/last')
var floor = require('lodash/floor')
var findIndex = require('lodash/findIndex')
var difference = require('lodash/difference')

var Router = {
  pathfinder: {}, // pathfinder object
  _points: {}, // network vertices
  pathBboxRectangeLayer: {},
  _route: {},
  routePath: {}, // linestring object name:path
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

  // {start}, {finish}: planet features
  createRoute: function (start, finish) {
    this._route.name = { start: start.properties.name, finish: finish.properties.name }
    var waypoints = [start, finish]
    var pathfinder = this.pathFinder
    // check if input waypoints are included in the network vertices
    // if not, update the waypoint to the nearest point in the network vertices
    var actualWaypoints = waypoints.map(function (wp) {
      var nearest = nearestPoint(wp, this._points) // turf.nearestPoint()
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
    this._route.path = legs[0]

    // complete _route data:
    var totalTime = legs.reduce(function (sum, l) { return sum + l.weight }, 0)
    var totalDistance = legs.reduce(function (sum, l) {
      var legDistance = l.path.reduce(function (d, c, i, cs) {
        if (i > 0) {
          return d + distance(point(cs[i - 1]), point(c)) * 1000
        }
        return d
      }, 0)
      return sum + legDistance
    }, 0)
    var waypointsLatLongArray = actualWaypoints.map(function (p) {
      var latlong = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
      return { latLng: latlong }
    })
    var inputWaypointsLatLongArray = waypoints.map(function (p) {
      var latlong = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
      return { latLng: latlong }
    })

    this._route.inputWaypoints = inputWaypointsLatLongArray
    this._route.waypoints = waypointsLatLongArray
    this._route.summary = {}
    this._route.summary.totalTime = totalTime
    this._route.summary.totalDistance = totalDistance
    console.log('_route:')
    console.log(this._route)

    this.addRouteToMap(this._route.path)
    this.addMissingSegments()
  },

  addRouteToMap: function (path) {
    this.map.removeLayer(this.routePathLayer)
    this.routePath = lineString(path.path, { name: 'path' })
    this.routePathLayer = L.geoJSON(this.routePath).addTo(this.map)
    this.addBboxRectangle()
    this.modalShow()
  },

  // add missing segment, input waypoint {point} to {path init point}:
  createStartLinestring: function (point) {
    var startPathPoint = this._route.path.path[0]
    var lonlats = [[point[1], point[0]], startPathPoint]
    var line = lineString(lonlats, { name: 'missing segment' })
    L.geoJSON(line, { color: 'gray', opacity: 0.65 }).addTo(this.map)
  },

  // add missing segment, last path point to input waypoint
  createFinishLinestring: function (point) {
    var finishPathPoint = last(this._route.path.path)
    var lonlats = [finishPathPoint, [point[1], point[0]]]
    var line = lineString(lonlats, { name: 'missing segment' })
    L.geoJSON(line, { color: 'gray', opacity: 0.65 }).addTo(this.map)
  },

  addMissingSegments: function () {
    var startSegment = []
    var finishSegment = []
    var route = this._route

    // check if inputwaypoints are not actual waypoints:
    startSegment = difference(route.inputWaypoints[0].latLng, route.waypoints[0].latLng)
    finishSegment = difference(route.inputWaypoints[1].latLng, route.waypoints[1].latLng)
    if (startSegment.length !== 0) {
      this.createStartLinestring(startSegment)
    }
    if (finishSegment.length !== 0) {
      this.createFinishLinestring(finishSegment)
    }
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

  // modal route info
  modalShow: function () {
    var route = this._route
    var totalDistance = floor(route.summary.totalDistance, 2)
    $('#route-Modal').modal('show')
    var title = 'ROUTE: ' + route.name.start + ' - ' + route.name.finish
    var body = '<p>Distance: ' + totalDistance + ' parsecs</p>'
    $('#route-Modal .modal-title').html(title)
    $('#route-Modal .modal-body').html(body)
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
    missingRoutes: [
      { color: 'black', opacity: 0.15, weight: 7 },
      { color: 'white', opacity: 0.6, weight: 4 },
      { color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12' }
    ]
  }
}

module.exports = Router
