/**
 * Data structures for the sf food simulation.
 *
 * @license MIT license: A Samuel Pottinger
 */


/**
 * A map entity (house, supermarket, or fast food).
 */
class Entity {

  /**
   * Create a new map entity.
   *
   * @param longitude The horizontal location of the entity in degrees.
   * @param latitude The vertical location of the entity in degrees.
   * @param type String describing the type of this entity (home, supermarket,
   *    fastFood).
   * @param state String state of this entity which is type specific.
   * @param updating Boolean flag indicating if this entity requires an update
   *    to its internal state.
   */
  constructor(longitude, latitude, type, state, updating) {
    const self = this;
    self._longitude = longitude;
    self._latitude = latitude;

    const projected = project({"longitude": longitude, "latitude": latitude});
    self._x = projected["x"];
    self._y = projected["y"];

    self._type = type;
    self._state = state;
    self._updating = updating;
  }

  /**
   * Get the longitude position of this entity.
   *
   * @returns Horizontal position in degrees.
   */
  getLongitude() {
    const self = this;
    return self._longitude;
  }

  /**
   * Get the latitude position of this entity.
   *
   * @returns Vertical position in degrees.
   */
  getLatitude() {
    const self = this;
    return self._latitude;
  }

  /**
   * Get the horizontal pixel position of this entity.
   *
   * @returns Horizontal position in simulation pixel space.
   */
  getX() {
    const self = this;
    return self._x;
  }

  /**
   * Get the vertical pixel position of this entity.
   *
   * @returns Vertical position in simulation pixel space.
   */
  getY() {
    const self = this;
    return self._y;
  }

  /**
   * Get type of entity.
   *
   * @returns String describing the type of this entity (home, supermarket,
   *    fastFood).
   */
  getType() {
    const self = this;
    return self._type;
  }

  /**
   * Get the state of this entity.
   *
   * For fastFood and supermarket, this is typically "static". For house,
   * this is either unknown while the simulation determines which food source
   * the house would use before switching to fastFood or supermarket.
   *
   * @returns The current state of this entity.
   */
  getState() {
    const self = this;
    return self._state;
  }

  /**
   * Set the state of this entity.
   *
   * @param newState String new state.
   */
  setState(newState) {
    const self = this;
    self._state = newState;
  }

  /**
   * Determine if this entity is waiting for a status update.
   *
   * @returns True if waiting for a status update and false otherwise.
   */
  getIsUpdating() {
    const self = this;
    return self._updating;
  }

  /**
   * Update if this entity is waiting for a status update.
   *
   * @param updating True if waiting for a status update and false otherwise.
   */
  setUpdating(updating) {
    const self = this;
    self._updating = updating;
  }

}


/**
 * Set of simulation entites: collection of interacting houses, supermarkets,
 * and fastFood.
 */
class EntitySet {

  /**
   * Create a new entity set.
   *
   * @param homes Array of entities with the "home" entity type.
   * @param fastFoods Array of entities with the "fastFood" entity type.
   * @param fastFoods Array of entities with the "supermarket" entity type.
   */
  constructor(homes, fastFoods, supermarkets) {
    const self = this;
    self._homes = homes;
    self._fastFoods = fastFoods;
    self._supermarkets = supermarkets;
    self._allowedDistanceDisparity = 1;
  }

  /**
   * Get all of the homes in the simulation.
   *
   * @return Array of entities with the "home" entity type.
   */
  getHomes() {
    const self = this;
    return self._homes;
  }

  /**
   * Get all of the fast food entites in the simulation.
   *
   * @return Array of entities with the "fastFood" entity type.
   */
  getFastFoods() {
    const self = this;
    return self._fastFoods;
  }

  /**
   * Create a new fast food location at a latitude and longitude.
   *
   * Create a new fastFood entity at a provided latitude and longitude, causing
   * all homes to have their state updated.
   *
   * @param longitude Horizontal position in degrees space.
   * @param latitude Vertical position in degrees space.
   */
  addFastFoodAt(longitude, latitude) {
    const self = this;

    self._fastFoods.push(new Entity(
      longitude,
      latitude,
      "fastFood",
      "static",
      false
    ));

    self._setAllHomesUpdating();
  }

  /**
   * Get all of the supermarket entites in the simulation.
   *
   * @return Array of entities with the "supermarket" entity type.
   */
  getSupermarkets() {
    const self = this;
    return self._supermarkets;
  }

  /**
   * Create a new supermarket location at a latitude and longitude.
   *
   * Create a new supermarket entity at a provided latitude and longitude,
   * causing all homes to have their state updated.
   *
   * @param longitude Horizontal position in degrees space.
   * @param latitude Vertical position in degrees space.
   */
  addSupermarketAt(longitude, latitude) {
    const self = this;

    self._supermarkets.push(new Entity(
      longitude,
      latitude,
      "supermarket",
      "static",
      false
    ));

    self._setAllHomesUpdating();
  }

  /**
   * Run state updates on a subset of waiting homes.
   *
   * Perform state updates on homes with the updating flag set to true but limit
   * the number of homes to be updated to the provided max. If a maximum is not
   * provided, a default of 50 is used.
   *
   * @param maxHomes Maximum to update.
   */
  updateHomes(maxHomes) {
    if (maxHomes === undefined) {
      maxHomes = 50;
    }

    const self = this;
    const waiting = self._homes.filter((x) => x.getIsUpdating());
    const toUpdate = waiting.slice(0, maxHomes);
    toUpdate.forEach((home) => { self._updateHome(home); });
    return toUpdate.length > 0;
  }
  
  setDistanceDisparity(distanceDisparity) {
    const self = this;
    self._allowedDistanceDisparity = distanceDisparity;
    self._setAllHomesUpdating();
  }

  _updateHome(target) {
    const self = this;

    const supermarketDistances = self._supermarkets.map(
      (supermarket) => self._findDistance(target, supermarket)
    );

    const fastFoodDistances = self._fastFoods.map(
      (supermarket) => self._findDistance(target, supermarket)
    );

    const supermarketMiles = Math.min(...supermarketDistances);
    const fastFoodMiles = Math.min(...fastFoodDistances);

    const distanceToFood = Math.min(supermarketMiles, fastFoodMiles);
    let newState = null;
    if (distanceToFood > 1) {
      newState = "unknown";
    } else {
      const disparity = supermarketMiles / fastFoodMiles;
      const supermarketByRatio = disparity < self._allowedDistanceDisparity;
      const supermarketByToll = Math.abs(
        supermarketMiles - fastFoodMiles
      ) < 0.1;
      const useSupermarket = supermarketByToll || supermarketByRatio;
      newState = useSupermarket ? "supermarket" : "fastFood";
    }

    target.setState(newState);
    target.setUpdating(false);
  }

  _findDistance(a, b) {
    const self = this;
    return findDistanceMiles(
      {"longitude": a.getLongitude(), "latitude": a.getLatitude()},
      {"longitude": b.getLongitude(), "latitude": b.getLatitude()}
    );
  }

  _setAllHomesUpdating() {
    const self = this;
    self._homes.forEach((x) => {x.setUpdating(true);});
  }

}
