function buildRawProjectKit() {
  const sourceProjection = "EPSG:4326";
  const destProjection = "EPSG:3785";
  const innerProjector = proj4(sourceProjection, destProjection);

  const forward = (latitude, longitude) => {
    const result = innerProjector.forward([longitude, latitude]);

    return {"x": result[0], "y": result[1]};
  };

  const reverse = (latitude, longitude) => {
    const result = innerProjector.inverse([longitude, latitude]);

    return {"x": result[0], "y": result[1]};
  };

  return {
    "forward": forward,
    "reverse": reverse
  };
}

const rawProjectKit = buildRawProjectKit();
const rawProject = rawProjectKit["forward"];
const rawProjectReverse = rawProjectKit["reverse"];


function buildTranslateScalePointKit() {
  const START_LAT = 37.8128;
  const START_LNG = -122.5206;
  const START_POINT = rawProject(START_LAT, START_LNG);
  const START_X = START_POINT["x"];
  const START_Y = START_POINT["y"];

  const END_LAT = 37.7083;
  const END_LNG = -122.3544;
  const END_POINT = rawProject(END_LAT, END_LNG);
  const END_X = END_POINT["x"];
  const END_Y = END_POINT["y"];

  const RANGE_X = END_X - START_X;
  const RANGE_Y = END_Y - START_Y;

  const ACTUAL_WIDTH = 625;
  const ACTUAL_HEIGHT = 500;

  const forward = (point) => {
    const offsetX = point["x"] - START_X;
    const offsetY = point["y"] - START_Y;
    const scaleX = offsetX / RANGE_X * ACTUAL_WIDTH;
    const scaleY = offsetY / RANGE_Y * ACTUAL_HEIGHT;

    return {
      x: scaleX,
      y: scaleY
    }
  };

  const reverse = (point) => {
    const scaleX = point["x"] / ACTUAL_WIDTH;
    const scaleY = point["y"] / ACTUAL_HEIGHT;
    const offsetX = scaleX * RANGE_X;
    const offsetY = scaleY * RANGE_Y;

    return {
      x: offsetX + START_X,
      y: offsetY + START_Y
    }
  };

  return {
    "forward": forward,
    "reverse": reverse
  };
}

const translateScalePointKit = buildTranslateScalePointKit();
const translateScalePoint = translateScalePointKit["forward"];
const translateScalePointReverse = translateScalePointKit["reverse"];


// Thanks https://stackoverflow.com/questions/14560999
function findDistanceMiles(source, destination) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var lon1 = source["x"];
  var lat1 = source["y"];

  var lon2 = destination["x"];
  var lat2 = destination["y"];

  var R = 6371; // km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2)
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  d /= 1.60934;

  return d;
}


function project(longitude, latitude) {
  if (longitude === undefined || latitude === undefined) {
    return null;
  }

  const point = rawProject(latitude, longitude);
  return translateScalePoint(point);
}
