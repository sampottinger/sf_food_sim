function buildRawProject() {
  const sourceProjection = "EPSG:4326";
  const destProjection = "EPSG:3785";
  const innerProjector = proj4(sourceProjection, destProjection);

  return (latitude, longitude) => {
    const result = innerProjector.forward([longitude, latitude]);

    return {x: result[0], y: result[1]};
  };
}

const rawProject = buildRawProject();


function buildTranslateScalePoint() {
  const START_LAT = 37.8128;
  const START_LNG = -122.5206;
  const START_POINT = rawProject(START_LAT, START_LNG);
  const START_X = START_POINT.x;
  const START_Y = START_POINT.y;

  const END_LAT = 37.7083;
  const END_LNG = -122.3544;
  const END_POINT = rawProject(END_LAT, END_LNG);
  const END_X = END_POINT.x;
  const END_Y = END_POINT.y;

  const RANGE_X = END_X - START_X;
  const RANGE_Y = END_Y - START_Y;

  const ACTUAL_WIDTH = 625;
  const ACTUAL_HEIGHT = 500;

  return (point) => {
    const offsetX = point.x - START_X;
    const offsetY = point.y - START_Y;
    const scaleX = offsetX / RANGE_X * ACTUAL_WIDTH;
    const scaleY = offsetY / RANGE_Y * ACTUAL_HEIGHT;

    return {
      x: scaleX,
      y: scaleY
    }
  };
}

const translateScalePoint = buildTranslateScalePoint();


function project(longitude, latitude) {
  if (longitude === undefined || latitude === undefined) {
    return null;
  }

  const point = rawProject(latitude, longitude);
  return translateScalePoint(point);
}
