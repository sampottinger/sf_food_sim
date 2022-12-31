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
  
  /**
   * Create a copy of this entity.
   *
   * @returns Copy of this entity.
   */
  clone() {
    const self = this;
    return new Entity(
      self._longitude,
      self._latitude,
      self._type,
      self._state,
      self._updating
    );
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
  constructor(homes, fastFoods, supermarkets, allowedDisparity, fastFoodEnabled,
    supermarketEnabled) {
    const self = this;
    self._homes = homes;
    self._fastFoods = fastFoods;
    self._supermarkets = supermarkets;
    self._allowedDistanceDisparity = allowedDisparity !== undefined ? allowedDisparity : 1;
    self._fastFoodEnabled = fastFoodEnabled !== undefined ? fastFoodEnabled : false;
    self._supermarketEnabled = supermarketEnabled !== undefined ? supermarketEnabled : false;
  }

  /**
   * Indicate if fast food entites should be shown / used.
   *
   * @param newFastFoodEnabled True if they should be enabled and false otherwise.
   */
  setFastFoodEnabled(newFastFoodEnabled) {
    const self = this;
    self._fastFoodEnabled = newFastFoodEnabled;
    self._setAllHomesUpdating();
  }

  /**
   * Indicate if supermarket entites should be shown / used.
   *
   * @param newSupermarketEnabled True if they should be enabled and false otherwise.
   */
  setSupermarketEnabled(newSupermarketEnabled) {
    const self = this;
    self._supermarketEnabled = newSupermarketEnabled;
    self._setAllHomesUpdating();
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
    if (self._fastFoodEnabled) {
      return self._fastFoods;
    } else {
      return [];
    }
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
   * Delete fast food locations at a latitude and longitude.
   *
   * Delete fast food entities at a provided latitude and longitude,
   * causing all homes to have their state updated.
   *
   * @param longitude Horizontal position in degrees space.
   * @param latitude Vertical position in degrees space.
   */
  delFastFoodAt(longitude, latitude) {
    const self = this;

    const getDistanceToClick = (x) => findDistanceMiles(
      {"longitude": longitude, "latitude": latitude},
      {"longitude": x.getLongitude(), "latitude": x.getLatitude()}
    );

    self._fastFoods = self._fastFoods.filter((x) => getDistanceToClick(x) > 0.1);

    self._setAllHomesUpdating();
  }

  /**
   * Get all of the supermarket entites in the simulation.
   *
   * @return Array of entities with the "supermarket" entity type.
   */
  getSupermarkets() {
    const self = this;
    if (self._supermarketEnabled) {
      return self._supermarkets;
    } else {
      return [];
    }
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
   * Delete supermarket locations at a latitude and longitude.
   *
   * Delete supermarket entities at a provided latitude and longitude,
   * causing all homes to have their state updated.
   *
   * @param longitude Horizontal position in degrees space.
   * @param latitude Vertical position in degrees space.
   */
  delSupermarketAt(longitude, latitude) {
    const self = this;

    const getDistanceToClick = (x) => findDistanceMiles(
      {"longitude": longitude, "latitude": latitude},
      {"longitude": x.getLongitude(), "latitude": x.getLatitude()}
    );

    self._supermarkets = self._supermarkets.filter((x) => getDistanceToClick(x) > 0.1);

    self._setAllHomesUpdating();
  }

  /**
   * Run state updates on a subset of waiting homes.
   *
   * Perform state updates on homes with the updating flag set to true but limit
   * the number of homes to be updated to the provided max. If a maximum is not
   * provided, a default of 75 is used.
   *
   * @param maxHomes Maximum to update.
   */
  updateHomes(maxHomes) {
    if (maxHomes === undefined) {
      maxHomes = 75;
    }

    const self = this;
    const waiting = self._homes.filter((x) => x.getIsUpdating());
    const toUpdate = waiting.slice(0, maxHomes);
    toUpdate.forEach((home) => { self._updateHome(home); });
    return toUpdate.length > 0;
  }

  /**
   * Set assumption of tollerated extra distance to supermarket.
   *
   * Set how much further someone is willing to go to supermarket compared to
   * fast food.
   *
   * @param distanceDisparity New ratio to use (supermarket distance divided by
   *    fast food distance). Will set home entities' status to supermarket if
   *    the ratio to closest supermarket is under this threshold.
   */
  setDistanceDisparity(distanceDisparity) {
    const self = this;
    self._allowedDistanceDisparity = distanceDisparity;
    self._setAllHomesUpdating();
  }
  
  /**
   * Create a copy of this entity set.
   *
   * @returns Copy of this entity set.
   */
  clone() {
    const self = this;
    return new EntitySet(
      self._homes.map((x) => x.clone()),
      self._fastFoods.map((x) => x.clone()),
      self._supermarkets.map((x) => x.clone()),
      self._allowedDistanceDisparity,
      self._fastFoodEnabled,
      self._supermarketEnabled
    );
  }

  /**
   * Determine the min value from a collection or, if empty, return empty value.
   *
   * @param target The collection from which to get the minimum.
   * @param emptyValue The value to use if the target collection is empty.
   * @returns Minimum value or emptyValue if target is empty.
   */
  _getMinOrEmpty(target, emptyValue) {
    if (target.length == 0) {
      return emptyValue;
    } else {
      return Math.min(...target);
    }
  }

  /**
   * Update a single home entity.
   *
   * @param target Entity with type of home to be updated.
   */
  _updateHome(target) {
    const self = this;

    const supermarketDistances = self.getSupermarkets().map(
      (supermarket) => self._findDistance(target, supermarket)
    );

    const fastFoodDistances = self.getFastFoods().map(
      (supermarket) => self._findDistance(target, supermarket)
    );

    const supermarketMiles = self._getMinOrEmpty(supermarketDistances, 100);
    const fastFoodMiles = self._getMinOrEmpty(fastFoodDistances, 100);

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

  /**
   * Find distance between two entities.
   *
   * @param a First entity from which distance should be measured.
   * @param b second entity to which distance should be measured.
   * @returns Miles between the two points.
   */
  _findDistance(a, b) {
    const self = this;
    return findDistanceMiles(
      {"longitude": a.getLongitude(), "latitude": a.getLatitude()},
      {"longitude": b.getLongitude(), "latitude": b.getLatitude()}
    );
  }

  /**
   * Set all homes to the requires update state.
   */
  _setAllHomesUpdating() {
    const self = this;
    self._homes.forEach((x) => {x.setUpdating(true);});
  }
  
  /**
   * Force invalidate sim state.
   */
  invalidate() {
    const self = this;
    self._setAllHomesUpdating();
  }

}
