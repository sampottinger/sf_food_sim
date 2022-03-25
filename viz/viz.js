/**
 * Main visualization logic.
 *
 * @license MIT license: A Samuel Pottinger
 */


/**
 * Presenter which manages and updates visualization state.
 */
class Presenter {

  /**
   * Create a new presenter.
   *
   * @entitySet Thet set of entities within the visualization / simulation.
   *    These will be updated and drawn by this presenter.
   */
  constructor(entitySet) {
    const self = this;
    self._entitySet = entitySet;

    self._canvas = document.getElementById("vizCanvas");
    self._ctx = self._canvas.getContext("2d");

    self._allowedTolleranceSlider = document.getElementById("allowedDistance");
    self._allowedTolleranceDisplay = document.getElementById(
      "allowedDistanceDisplay"
    );

    self._supermarketNumericDisplay = document.getElementById(
      "supermarketNumericDisplay"
    );
    self._supermarketBarDisplay = document.getElementById(
      "supermarketBarDisplay"
    );

    self._fastFoodNumericDisplay = document.getElementById(
      "fastFoodNumericDisplay"
    );
    self._fastFoodBarDisplay = document.getElementById(
      "fastFoodBarDisplay"
    );

    self._unknownNumericDisplay = document.getElementById(
      "unknownNumericDisplay"
    );
    self._unknownBarDisplay = document.getElementById(
      "unknownBarDisplay"
    );

    self._allowedTolleranceSlider.addEventListener(
      "change",
      () => { self._onTolleranceChange(); }
    );

    self._onTolleranceChange();

    self._canvas.addEventListener('click', (event) => {
      self._onLeftClick(event);
      event.preventDefault();
    });

    self._canvas.addEventListener('contextmenu', (event) => {
      self._onRightClick(event);
      event.preventDefault();
    });
  }

  /**
   * Draw all entities within the visualization / simulation.
   */
  draw() {
    const self = this;

    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);

    self._entitySet.getHomes().forEach((home) => {
      const color = {
        "unknown": "#EAEAEA",
        "supermarket": "#A6CEE3",
        "fastFood": "#B2DF8A"
      }[home.getState()];

      if (home.getState() === "fastFood") {
        self._squareEmpty(home.getX(), home.getY(), 3, color);
      } else {
        self._ring(home.getX(), home.getY(), 3, color);
      }
    });

    self._entitySet.getFastFoods().forEach((fastFood) => {
      self._squareFill(fastFood.getX(), fastFood.getY(), 5, "#33A02C");
    });

    self._entitySet.getSupermarkets().forEach((supermarket) => {
      self._ellipse(supermarket.getX(), supermarket.getY(), 5, "#1F78B4");
    });
  }

  /**
   * Draw and update all entites (that are waiting for updates) in the viz.
   */
  update() {
    const self = this;

    const hasUpdates = self._entitySet.updateHomes();
    if (hasUpdates) {
      self.draw();
      self._updateSummary();
    }
  }

  /**
   * Draw a residential entity as a non-filled in circle.
   *
   * @param x The x (horizontal) coordinate (pixels) at which to draw the
   *    circle.
   * @param y The y (vertical) coordinate (pixels) at which to draw the circle.
   * @param radius The radius of the circle in pixels.
   * @param color The string hex color in which to draw the circle.
   */
  _ring(x, y, radius, color) {
    const self = this;
    self._ctx.save();
    self._ctx.beginPath();
    self._ctx.arc(x, y, radius, radius, -Math.PI - 0.1, Math.PI + 0.1, false);
    self._ctx.strokeStyle = color;
    self._ctx.lineWidth = 2;
    self._ctx.stroke();
    self._ctx.closePath();
    self._ctx.restore();
  }

  /**
   * Draw a residential entity as a non-filled in square.
   *
   * @param x The x (horizontal) coordinate (pixels) at which to draw the
   *    square.
   * @param y The y (vertical) coordinate (pixels) at which to draw the square.
   * @param radius The radius of the square in pixels.
   * @param color The string hex color in which to draw the square.
   */
  _squareEmpty(x, y, radius, color) {
    const self = this;
    self._ctx.save();
    self._ctx.strokeStyle = color;
    self._ctx.lineWidth = 2;
    self._ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
    self._ctx.restore();
  }

  /**
   * Draw a non-residential entity as a filled in circle.
   *
   * @param x The x (horizontal) coordinate (pixels) at which to draw the
   *    circle.
   * @param y The y (vertical) coordinate (pixels) at which to draw the circle.
   * @param radius The radius of the circle in pixels.
   * @param color The string hex color in which to draw the circle.
   */
  _ellipse(x, y, radius, color) {
    const self = this;
    self._ctx.save();
    self._ctx.beginPath();
    self._ctx.arc(x, y, radius, radius, -Math.PI - 0.1, Math.PI + 0.1, false);
    self._ctx.fillStyle = color;
    self._ctx.globalAlpha = 0.6;
    self._ctx.fill();
    self._ctx.closePath();
    self._ctx.restore();
  }

  /**
   * Draw a fast food entity as a filled in square.
   *
   * @param x The x (horizontal) coordinate (pixels) at which to draw the
   *    square.
   * @param y The y (vertical) coordinate (pixels) at which to draw the square.
   * @param radius The radius of the square in pixels.
   * @param color The string hex color in which to draw the square.
   */
  _squareFill(x, y, radius, color) {
    const self = this;
    self._ctx.save();
    self._ctx.fillStyle = color;
    self._ctx.globalAlpha = 0.6;
    self._ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    self._ctx.restore();
  }

  /**
   * Callback for when the distance disparity parameter changes.
   *
   * Callback function for when the user changes the slider in the visualization
   * corresponding to how much further the simulation assumes one will go to get
   * to a supermarket instead of fast food.
   */
  _onTolleranceChange() {
    const self = this;
    self._entitySet.setDistanceDisparity(self._allowedTolleranceSlider.value);
    self._updateTolleranceDisplay();
  }

  /**
   * Update display with info about the distance disparity parameter change.
   *
   * Update HTML elements which display the parameter corresponding to how much
   * further the simulation assumes one will go to get to a supermarket instead
   * of fast food.
   */
  _updateTolleranceDisplay() {
    const self = this;
    const allowed = Math.round(
      (self._allowedTolleranceSlider.value - 1) * 20
    ) / 20 * 100;
    const isPos = allowed > 0;
    const allowedStr = isPos ? "+" + allowed : allowed;
    self._allowedTolleranceDisplay.innerHTML = allowedStr + "%";
  }

  /**
   * Display distribution of residential entity states as percentages.
   *
   * Update chart which shows what percent of simulated residential / home
   * entities are simulated to go to fast food, supermarkets, or neither.
   */
  _updateSummary() {
    const self = this;

    const homes = self._entitySet.getHomes();
    const countTotal = homes.length;

    const counts = {
      "unknown": 0,
      "fastFood": 0,
      "supermarket": 0
    };
    const homeCountFastFood = homes.forEach((home) => {
      counts[home.getState()]++;
    });

    const percentUnknown = Math.round(
      counts["unknown"] / countTotal * 100
    );
    const percentSuperMarket = Math.round(
      counts["supermarket"] / countTotal * 100
    );
    const percentFastFood = Math.round(
      counts["fastFood"] / countTotal * 100
    );

    const unknownStr = percentUnknown + "% more than 1 mile from either";
    const supermarketStr = percentSuperMarket + "% choose supermarket";
    const fastFoodStr = percentFastFood + "% choose fast food";

    self._unknownNumericDisplay.innerHTML = unknownStr;
    self._supermarketNumericDisplay.innerHTML = supermarketStr;
    self._fastFoodNumericDisplay.innerHTML = fastFoodStr;

    const unknownWidth = (percentUnknown * 2) + "px";
    const supermarketWidth = (percentSuperMarket * 2) + "px";
    const fastFoodWidth = (percentFastFood * 2) + "px";

    self._unknownBarDisplay.style.width = unknownWidth;
    self._supermarketBarDisplay.style.width = supermarketWidth;
    self._fastFoodBarDisplay.style.width = fastFoodWidth;
  }

  /**
   * Callback for left click in the visualization canvas.
   *
   * Callback for when the user left clicks to construct a new simulated
   * supermarket.
   */
  _onLeftClick(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.addSupermarketAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
  }

  /**
   * Callback for right / secondary click in the visualization canvas.
   *
   * Callback for when the user right clicks to construct a new simulated
   * supermarket.
   */
  _onRightClick(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.addFastFoodAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
  }

  /**
   * Get the position of the mouse in the visualization canvas.
   *
   * @param event The event from the mouse / cursor.
   * @returns Object on which the x attribute corresponds to horizontal pixel
   *    position of mouse relative to 0, 0 position on canvas and y attribute
   *    corresponds to horizontal pixel position of mouse relative to 0, 0.
   */
  _getMousePos(event) {
    const self = this;
    const rect = self._canvas.getBoundingClientRect();
    return {
      "x": event.clientX - rect.left,
      "y": event.clientY - rect.top
    };
  }

}


/**
 * Force a value to be a float.
 *
 * @param target The string or float value to be forced to be a float.
 * @returns The value of target interpreted as a float.
 */
function forceFloat(target) {
  if (typeof target === "string") {
    return parseFloat(target);
  } else {
    return target;
  }
}


/**
 * Determine if a value is a "valid" floating point value.
 *
 * @param target The value to check.
 * @returns True if the target is a finite floating point value and false
 *    otherwise.
 */
function isValid(target) {
  return target !== undefined && isFinite(target);
}


/**
 * Randomize the order of elements in an array.
 *
 * @param target The array whose order should be randomized.
 * @returns Array with all of the same elements as the input array but returned
 *    in a new order.
 * @source stackoverflow.com/questions/2450954
 */
function shuffle(target) {
  return target
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}


/**
 * Start the periodic render / update loop for the simulation.
 *
 * @param presenter The presenter that should be perodically rendered / updated.
 */
function startDrawLoop(presenter) {
  setInterval(() => {
    presenter.update();
  }, 150);
}


/**
 * Callback when entity information is loaded.
 *
 * Callback for when the starting entity information is loaded from the
 * visualization source CSV file. This will start the draw / update loop.
 *
 * @param results The starting entity CSV file.
 */
function onEntityLoad(results) {
  const homes = [];
  const fastFoods = [];
  const supermarkets = [];

  const listsByType = {
    home: homes,
    fastFood: fastFoods,
    supermarket: supermarkets
  };

  results.data.forEach((row) => {
    const newType = row["featureType"];
    const newState = newType === "home" ? "unknown" : "static";

    const longitude = forceFloat(row["longitude"]);
    const latitude = forceFloat(row["latitude"]);

    const lngOk = isValid(longitude);
    const latOk = isValid(latitude);

    if (lngOk && latOk) {
      const newEntity = new Entity(
        longitude,
        latitude,
        newType,
        newState,
        newType === "home"
      );
      listsByType[newType].push(newEntity);
    }
  });

  const homesShuffle = shuffle(homes);

  const entitySet = new EntitySet(homesShuffle, fastFoods, supermarkets);
  const presenter = new Presenter(entitySet);

  startDrawLoop(presenter);
}


/**
 * Request that visualization entity data be loaded.
 *
 * Request that visualization entity data be loaded, creating the visualization
 * presenter and starting the draw / update loop afterwards.
 */
function loadEntitySet() {
  Papa.parse("./combined.csv", {
    download: true,
    complete: onEntityLoad,
    header: true
  });
}


loadEntitySet();
