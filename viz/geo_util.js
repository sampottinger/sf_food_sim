/**
 * Utilities for map projections.
 *
 * @license MIT license: A Samuel Pottinger
 */


/**
 * Build a set of functions that allow for using a map projection.
 *
 * Build a set of functions that allow for using a map projection assuming
 * lat / lng are given in EPSG:4326 and pixel positions are transformed from
 * EPSG:3785.
 *
 * @returns Object with a "forward" and a "reverse" attribute, both methods as
 *    described below.
 */
function buildRawProjectKit() {
  const sourceProjection = "EPSG:4326";
  const destProjection = "EPSG:3785";
  const innerProjector = proj4(sourceProjection, destProjection);

  /**
   * Project a longitude latitude pair to an x and y meter coordinate.
   *
   * @param point Object with latitude and longitude attributes whose floating
   *    point values correspond to degrees.
   * @returns Object whose x attribute is the x horizontal meter position and y
   *    attribute the vertical meter position.
   */
  const forward = (point) => {
    const longitude = point["longitude"];
    const latitude = point["latitude"];
    const result = innerProjector.forward([longitude, latitude]);

    return {"x": result[0], "y": result[1]};
  };

  /**
   * Project an x and y pair to longitude and latitude coordinates.
   *
   * @param point Object with x and t attributes whose floating point values
   *    correspond to meters.
   * @returns Object whose longitude attribute is the horizontal position in
   *    degrees and whose latitude attribute corresponds to the vertical
   *    position in degrees.
   */
  const reverse = (point) => {
    const x = point["x"];
    const y = point["y"];
    const result = innerProjector.inverse([x, y]);

    return {"longitude": result[0], "latitude": result[1]};
  };

  return {
    "forward": forward,
    "reverse": reverse
  };
}

const rawProjectKit = buildRawProjectKit();
const rawProject = rawProjectKit["forward"];
const rawProjectReverse = rawProjectKit["reverse"];


/**
 * Create fucntions for centering a map projection to pixels on San Francisco.
 *
 * Create functions which center and scale the resulting pixel coordinates to
 * show San Francisco on the simulation canvas.
 *
 * @returns Object with attributes "forward" and "reverse" which are both
 *    methods a described below.
 */
function buildTranslateScalePointKit() {
  const START_LAT = 37.8128;
  const START_LNG = -122.5206;
  const START_POINT = rawProject(
    {"longitude": START_LNG, "latitude": START_LAT}
  );
  const START_X = START_POINT["x"];
  const START_Y = START_POINT["y"];

  const END_LAT = 37.7083;
  const END_LNG = -122.3544;
  const END_POINT = rawProject({"longitude": END_LNG, "latitude": END_LAT});
  const END_X = END_POINT["x"];
  const END_Y = END_POINT["y"];

  const RANGE_X = END_X - START_X;
  const RANGE_Y = END_Y - START_Y;

  const ACTUAL_WIDTH = 625;
  const ACTUAL_HEIGHT = 500;

  /**
   * Project from meter space to pixel space for the simulation.
   *
   * Function which converts a point in standard EPSG:3785 space to pixel
   * coordiantes which can be displayed in the simulation canvas.
   *
   * @param point Object which has floating point values on x and y attributes
   *    representing a position in meter space.
   * @returns Object with x and y attributes both containing floating point
   *    values representing a position in pixel space.
   */
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

  /**
   * Project from pixel space to meter space for the simulation.
   *
   * Function which converts a point in pixel coordiantes which can be displayed
   * in the simulation canvas to standard EPSG:3785 space.
   *
   * @param point Object which has floating point values on x and y attributes
   *    representing a position in pixel space.
   * @returns Object with x and y attributes both containing floating point
   *    values representing a position in meter space.
   */
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


/**
 * Find the distance between two latitude / longitude points.
 *
 * Apply the Haversine formula to find the distance betweenn to latitude /
 * longitude points in miles.
 *
 * @param source Object which has latitude and longitude attributes.
 * @param destination Object which has latitude and longitude attributes.
 * @source https://stackoverflow.com/questions/14560999
 * @returns The distance between the two points in miles.
 */
function findDistanceMiles(source, destination) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var lon1 = source["longitude"];
  var lat1 = source["latitude"];

  var lon2 = destination["longitude"];
  var lat2 = destination["latitude"];

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


/**
 * Project a point in degrees space to pixel space.
 *
 * Facade function which executes the full projection pipeline to map project a
 * point in degrees space to pixel space via EPSG:3785 (WGS 84 / World
 * Mercator).
 *
 * @param point The point in "degree" space (latitude and longitude) to be
 *    projected (EPSG:4326).
 * @returns Object with x and y attributes containing pixel coordinates
 *    corresponding to the point provided.
 */
function project(point) {
  const longitude = point["longitude"];
  const latitude = point["latitude"];
  if (longitude === undefined || latitude === undefined) {
    return null;
  }

  const pointMeters = rawProject(point);
  return translateScalePoint(pointMeters);
}
