/* global */
var L = require('leaflet')
var $ = require('jquery')

var PlanetsAutocomplete = require('./modules/form')
var Router = require('./modules/hyperspace-router')

var planets
var hyperspaceSinglepart
$.when(
  $.get('data/hyperspace_singlepart.json', function (response) {
    hyperspaceSinglepart = response
  }),
  $.get('data/planets.json', function (response) {
    planets = response
    PlanetsAutocomplete(planets)
  })

).then(function () {
  initialize(hyperspaceSinglepart)
})
var map = L.map('map')
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

  // add planets layer
  function getRadius (zoom) {
    return zoom === 0 ? 4
      : zoom === 1 ? 3
        : zoom === 2 ? 2
          : 1
  }
  function planetsStyle (feature) {
    return {
      radius: getRadius(feature.properties.zm),
      fillColor: '#ff7800',
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }
  }
  function onEachFeature (feature, layer) {
    if (feature.properties.name) {
      layer.bindPopup(feature.properties.name)
    }
  }

  // add planets layer to map
  var planetLayer = L.geoJSON(planets, {
    style: planetsStyle,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, planetsStyle)
    },
    onEachFeature: onEachFeature,
    filter: function (feature, layer) {
      if (feature.properties.canon === 1) {
        return feature.properties.canon
      }
    }
  }).addTo(map)

  // add layer control
  var overlayLayers = {
    Planets: planetLayer
  }
  L.control.layers(null, overlayLayers).addTo(map)
}
