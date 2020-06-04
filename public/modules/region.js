var L = require('leaflet')
var _find = require('lodash/find')

var Regions = {

  add: function (regions) {
    console.log('add region')
    console.log(regions)
    var regionsLayer = L.geoJSON(regions, {
      style: this.regionsStyle,
      onEachFeature: this.onEachFeature
    })
    return regionsLayer
  },
  regionsStyle: function (feature) {
    return {
      fillColor: regionColorDict[feature.properties.rid].color,
      color: 'white',
      fillOpacity: 0.15,
      weight: 1
    }
  },

  onEachFeature: function (feature, layer) {
    if (feature.properties.name) {
      layer.bindPopup(feature.properties.name)
    }
  }
}

module.exports = Regions

// https://colorbrewer2.org/#type=sequential&scheme=Greys&n=9
var regionColorDict = [
  { rid: 0, color: '#ffffff', name: '' },
  { rid: 1, color: '#ffffff', name: 'deep core' },
  { rid: 2, color: '#f0f0f0', name: 'core' },
  { rid: 3, color: '#d9d9d9', name: 'colonies' },
  { rid: 4, color: '#bdbdbd', name: 'inner rim' },
  { rid: 5, color: '#969696', name: 'expansion' },
  { rid: 6, color: '#737373', name: 'mid rim' },
  { rid: 7, color: '#525252', name: 'hutt' },
  { rid: 8, color: '#252525', name: 'outer rim' },
  { rid: 9, color: '#000000', name: 'wild' },
  { rid: 10, color: '#000000', name: 'wild' }
]
