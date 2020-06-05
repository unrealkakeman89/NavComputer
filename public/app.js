/* global */
var L = require('leaflet')
var $ = require('jquery')

var PlanetsAutocomplete = require('./modules/form')
var Router = require('./modules/hyperspace-router')
var Regions = require('./modules/region') // add region layer
var Planets = require('./modules/planets') // add planets layer

var planetsLayer
var regionsLayer
var hyperspaceSinglepart

$.when(
  $.get('data/hyperspace_singlepart_new.json', function (response) {
    hyperspaceSinglepart = response
  }),
  $.get('data/planets.json', function (response) {
    planetsLayer = Planets.add(response)
    PlanetsAutocomplete(response)
  }),
  $.get('data/region.json', function (response) {
    regionsLayer = Regions.add(response)
  })
).then(function () {
  initialize(hyperspaceSinglepart)
})

var map = L.map('map')

var mapAttribution = 'Data from: <a href="http://www.swgalaxymap.com/" title="Star Wars Galaxy Map">swgalaxymap.com</a>'
map.attributionControl.addAttribution(mapAttribution)

var style = {
  fillColor: 'blue',
  color: '#000',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.7
}

function initialize (network) {
  console.log('INITIALIZING NETWORK: ' + network.name)

  var hyperspace = new L.GeoJSON(network, {
    style: style
  }).addTo(map)
  map.fitBounds(hyperspace.getBounds())

  var pathfinder = Router.createPathFinder(network, map)

  planetsLayer.addTo(map)
  regionsLayer.addTo(map).bringToBack()

  // add layer control
  var overlayLayers = {
    Planets: planetsLayer,
    Regions: regionsLayer
  }

  L.control.layers(null, overlayLayers).addTo(map)
}
