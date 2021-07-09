// API variables
var bingMapsAPIKey = 'Am5wPaPARFbTg8nTh5r3G_otpR0eFt9wdG42edvY_RME7RXfGpKs5QyXb5UoEA8K';
var spaceStationWaypoint = '28.591402053833008,-80.58963775634766';

// Custom map style
var mapStyle = {
    "version": "1.0",
    "settings": {
        "landColor": "#0B334D"
    },
    "elements": {
        "mapElement": {
            "labelColor": "#FFFFFF",
            "labelOutlineColor": "#000000"
        },
        "political": {
            "borderStrokeColor": "#144B53",
            "borderOutlineColor": "#00000000"
        },
        "point": {
            "iconColor": "#0C4152",
            "fillColor": "#000000",
            "strokeColor": "#0C4152"
        },
        "transportation": {
            "strokeColor": "#000000",
            "fillColor": "#000000"
        },
        "highway": {
            "strokeColor": "#158399",
            "fillColor": "#000000"
        },
        "controlledAccessHighway": {
            "strokeColor": "#158399",
            "fillColor": "#000000"
        },
        "arterialRoad": {
            "strokeColor": "#157399",
            "fillColor": "#000000"
        },
        "majorRoad": {
            "strokeColor": "#157399",
            "fillColor": "#000000"
        },
        "railway": {
            "strokeColor": "#146474",
            "fillColor": "#000000"
        },
        "structure": {
            "fillColor": "#115166"
        },
        "water": {
            "fillColor": "#021019"
        },
        "area": {
            "fillColor": "#115166"
        }
    }
};

var landingSites = {};
// get the Bing map
function GetMap() {
    landingSites.map = new Microsoft.Maps.Map('#myMap', {
        credentials: bingMapsAPIKey,
        center: new Microsoft.Maps.Location(1, 1),
        zoom: 0,
        customMapStyle: mapStyle
    });
}

// Activate HTML modal as a bootstrap modal
var landingInfoModal = new bootstrap.Modal(document.getElementById('landing-info-modal'));
var generalInfoModal = new bootstrap.Modal(document.getElementById('general-info-modal'));

// Show general info model
generalInfoModal.show();

// Search box variables
var searchForm = document.getElementById('search-form');
var searchBox = document.getElementById('search-box');
var searchButton = document.getElementById('search-button');

// Event listeners
searchButton.addEventListener("click", findLandingSites);
searchForm.addEventListener("submit", function(e) {
  e.preventDefault();
  findLandingSites();
});


function getQueryInput() {
  return searchBox.value;
}

function findLandingSites() {
  var query = getQueryInput();

  // Make sure user has filled in a search query
  if (query.length > 0) {
    landingSites.map.setView({
      center: new Microsoft.Maps.Location(1, 1),
      zoom: 0
    })
    getLocationsFromAPI(query);
  }
}

function getLocationsFromAPI(location) {
  var url = 'http://dev.virtualearth.net/REST/v1/Locations?q='+location+'&key='+bingMapsAPIKey;

  fetch(url)
    .then(response => {
      return response.json();
    })
    .then(data => {
      showLandingSitesOnMap(data);
    });
}

function showLandingSitesOnMap(responseData) {
  // The estimatedTotal property tells if there are locations found or not.
  if (responseData.resourceSets[0].estimatedTotal > 0) {
    // First remove all existing pushpins
    landingSites.map.entities.clear();
    // Add new pushpins to map
    responseData.resourceSets[0].resources.forEach(addPinToMap);
  } else {
    alert('No landing sites were found.')
  }
}

function addPinToMap(resource) {
  // Check if pushpin with same location already exists
  var numberOfMapEntities = landingSites.map.entities.getLength();
  var doesPinLocationAlreadyExist = false;

  if (numberOfMapEntities > 0) {
    for (var i = 0; i < numberOfMapEntities; i++) {
      entity = landingSites.map.entities.get(i);
      if (entity.geometry.x == resource.point.coordinates[1] && entity.geometry.y == resource.point.coordinates[0]) {
        doesPinLocationAlreadyExist = true;
      }
    }
  }

  // If pushpin location does not exist, add to map
  if (!doesPinLocationAlreadyExist) {
    var pinLocation = new Microsoft.Maps.Location(resource.point.coordinates[0], resource.point.coordinates[1]);

    // Create custom Pushpin
    var pin = new Microsoft.Maps.Pushpin(pinLocation, {
        title: resource.address.formattedAddress,
        icon: 'images/falcon.png',
        anchor: new Microsoft.Maps.Point(14, 100)
    });

    // Add the pushpin to the map
    landingSites.map.entities.push(pin);

    // Add event handlers to the pushpin
    Microsoft.Maps.Events.addHandler(pin, 'mouseover', function() {changeMouseState('pointer');});
    Microsoft.Maps.Events.addHandler(pin, 'mouseout', function() {changeMouseState('unset');});
    Microsoft.Maps.Events.addHandler(pin, 'click', function() {triggerLandingInfoModal(pin);});
  }
}

function changeMouseState(state) {
  map = document.getElementById('myMap');
  map.style.cursor = state;
}

function triggerLandingInfoModal(pushpin) {
  clearModalInfo();
  fillModalWithNewInfo(pushpin);

  // Trigger bootstrap modal show function
  landingInfoModal.show();
}

// Clear modal in case it has old info from previous clicked pushpin
function clearModalInfo() {
  var modalTitle = document.getElementById('landing-info-modal').getElementsByClassName('landing-site-location')[0];
  var modalRoute = document.getElementById('landing-info-modal').getElementsByClassName('route')[0];
  var modalBirdseye = document.getElementById('landing-info-modal').getElementsByClassName('birdseye')[0];
  var modalStreetside = document.getElementById('landing-info-modal').getElementsByClassName('streetside')[0];

  modalTitle.innerHTML = '';
  modalRoute.innerHTML = '';
  modalBirdseye.innerHTML = '';
  modalStreetside.innerHTML = '';
}

// Fill modal with passed info from pushpin
function fillModalWithNewInfo(pushpin) {
  var modalTitle = document.getElementById('landing-info-modal').getElementsByClassName('landing-site-location')[0];
  modalTitle.innerHTML = pushpin.entity.title;

  var location = pushpin.getLocation();

  getLandingSiteImageDetails(location);
}

function getLandingSiteImageDetails(location) {
  var wayPointFrom = location.latitude + ',' + location.longitude;

  getRouteToSpaceStation(wayPointFrom);
  getLandingSiteImages(wayPointFrom);
}

function getRouteToSpaceStation(wayPointFrom) {
  // var url = 'https://dev.virtualearth.net/REST/v1/Imagery/Map/Road/Routes?waypoint.1='+wayPointFrom+'&waypoint.2='+spaceStationWaypoint+'&key='+bingMapsAPIKey;
  var url = 'https://dev.virtualearth.net/REST/v1/Imagery/Map/AerialWithLabels/Routes/Driving?waypoint.1='+wayPointFrom+'&waypoint.2='+spaceStationWaypoint+
            '&format=jpeg&key='+bingMapsAPIKey;

  fetch(url)
    .then(response => {
      return response.blob();
    })
    .then(data => {
      if(data.type == 'image/jpeg') {
        parseImageDataToInfoModal(data, 'route');
      } else {
        parseImageAPIError('A route can not be generated from this location.', 'route');
      }
    });
}

function getLandingSiteImages(wayPoint) {
  var urlBirdseye = 'http://dev.virtualearth.net/REST/V1/Imagery/Map/Birdseye/'+wayPoint+'/18?dir=270&ms=700,350&key='+bingMapsAPIKey;
  var urlStreetside = 'http://dev.virtualearth.net/REST/v1/Imagery/Map/Streetside/'+wayPoint+'?zoomlevel=5&heading=145&pitch=5&key='+bingMapsAPIKey;

  fetch(urlBirdseye)
    .then(response => {
      return response.blob();
    })
    .then(data => {
      if(data.type == 'image/jpeg') {
        parseImageDataToInfoModal(data, 'birdseye');
      } else {
        parseImageAPIError('A top view image can not be generated for this location.', 'birdseye');
      }
    });

  fetch(urlStreetside)
    .then(response => {
      return response.blob();
    })
    .then(data => {
      if(data.type == 'image/jpeg') {
        parseImageDataToInfoModal(data, 'streetside');
      } else {
        parseImageAPIError('A streetside image can not be generated for this location.', 'streetside');
      }
    });
}

function parseImageAPIError(errorMessage, element) {
  var modalBody = document.getElementById('landing-info-modal').getElementsByClassName(element)[0];
  var alert = document.createElement('div');

  alert.classList.add('alert','alert-danger');
  alert.innerHTML = errorMessage;

  modalBody.append(alert);
}

function parseImageDataToInfoModal(data, element) {
  var modalBody = document.getElementById('landing-info-modal').getElementsByClassName(element)[0];
  var imageSrc = URL.createObjectURL(data);
  var image = new Image();

  image.classList.add("w-100");
  image.src = imageSrc;

  modalBody.append(image);
}
