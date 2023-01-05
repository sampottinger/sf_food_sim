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
    self._originalSet = entitySet.clone();
    self._overlayChange = false;
    self._hasOverlay = false;
    self._overlayX = null;
    self._overlayY = null;
    self._overlayRadius = null;
    self._constructionCost = 0;

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

    self._canvas.addEventListener("click", (event) => {
      self._onLeftClick(event);
      event.preventDefault();
    });
    
    document.getElementById("resetLink").addEventListener("click", (event) => {
      self.reset();
      event.preventDefault();
    });
  }

  /**
   * Indicate if fast food entites should be shown / used.
   *
   * @param newFastFoodEnabled True if they should be enabled and false otherwise.
   */
  setFastFoodEnabled(newFastFoodEnabled) {
    const self = this;
    self._entitySet.setFastFoodEnabled(newFastFoodEnabled);
  }

  /**
   * Indicate if supermarket entites should be shown / used.
   *
   * @param newSupermarketEnabled True if they should be enabled and false otherwise.
   */
  setSupermarketEnabled(newSupermarketEnabled) {
    const self = this;
    self._entitySet.setSupermarketEnabled(newSupermarketEnabled);
  }

  /**
   * Draw all entities within the visualization / simulation.
   */
  draw() {
    const self = this;

    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);

    self._entitySet.getHomes().forEach((home) => {
      const color = {
        "unknown": "#C0C0C0",
        "supermarket": "#A6CEE3",
        "fastFood": "#B2DF8A"
      }[home.getState()];

      if (home.getState() === "supermarket") {
        self._ring(home.getX(), home.getY(), 3, color);
      } else {
        self._squareEmpty(home.getX(), home.getY(), 3, color);
      }
    });

    self._entitySet.getFastFoods().forEach((fastFood) => {
      self._squareFill(fastFood.getX(), fastFood.getY(), 5, "#33A02C");
    });

    self._entitySet.getSupermarkets().forEach((supermarket) => {
      self._ellipse(supermarket.getX(), supermarket.getY(), 5, "#1F78B4");
    });

    if (self._hasOverlay) {
      self._ring(self._overlayX, self._overlayY, self._overlayRadius, "#303030");
    }
  }

  /**
   * Draw and update all entites (that are waiting for updates) in the viz.
   */
  update() {
    const self = this;

    const hasUpdates = self._entitySet.updateHomes();
    if (hasUpdates || self._overlayChange) {
      self.draw();
      self._updateSummary();
      self._overlayChange = false;
    }
  }
  
  /**
   * Reset the simulation.
   */
  reset() {
    const self = this;
    self._entitySet = self._originalSet;
    self._originalSet = self._originalSet.clone();
    self._entitySet.invalidate();
    self._constructionCost = 0;
    self._allowedTolleranceSlider.value = "1.0";

    self._onTolleranceChange();
    showMap(self);
    enableSupermarkets(self);
    enableFastFood(self);
    showSummary(self);
    showControls(self);
  }

  /**
   * Add an overlay ellipse, like for the tutorial.
   *
   * @param x The x coordinate of the overlay in pixels.
   * @param y The y coordinate of the overlay in pixels.
   * @param radius The radius of the overlay in pixels.
   */
  addOverlay(x, y, radius) {
    const self = this;

    self._overlayChange = true;
    self._hasOverlay = true;
    self._overlayX = x;
    self._overlayY = y;
    self._overlayRadius = radius;
  }

  /**
   * Remove overlay ellipse, like for the tutorial.
   */
  clearOverlay(x, y, radius) {
    const self = this;

    self._overlayChange = true;
    self._hasOverlay = false;
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
    
    const transitSpend = Math.pow((self._allowedTolleranceSlider.value - 1) * 50, 1.3);
    const constructionSpend = self._constructionCost * 30;
    const totalSpend = constructionSpend + transitSpend;
    document.getElementById("percentSpent").innerHTML = Math.round(totalSpend) + "%";
    document.getElementById("transitPercent").innerHTML = Math.round(transitSpend) + "%";
    document.getElementById("constructionPercent").innerHTML = Math.round(constructionSpend) + "%";
    
    if (totalSpend > 100) {
      document.getElementById("statusEmoji").innerHTML = "Oops! You went over budget.";
      document.getElementById("goalImage").src = "./people/budget.png";
      document.getElementById("goalImage").alt = "Picture of dollar bill with red alert icon.";
    } else if (percentSuperMarket >= 80) {
      document.getElementById("statusEmoji").innerHTML = "Success!";
      document.getElementById("goalImage").src = "./people/ribbon.png";
      document.getElementById("goalImage").alt = "Picture of a blue ribbon.";
    } else {
      document.getElementById("statusEmoji").innerHTML = "Keep going!";
      document.getElementById("goalImage").src = "./people/easel.png";
      document.getElementById("goalImage").alt = "Picture of a graph going up and to the right.";
    }
  }

  /**
   * Determine which construction mode is selected by the user.
   *
   * @returns String describing current construction selection.
   */
  _getConstructionSelection() {
    const self = this;

    if (document.getElementById("supermarketRadio").checked) {
      return "addSupermarket";
    } else if (document.getElementById("fastFoodRadio").checked) {
      return "addFastFood";
    } else if (document.getElementById("delSupermarketRadio").checked) {
      return "delSupermarket";
    } else if (document.getElementById("delFastFoodRadio").checked) {
      return "delFastFood";
    } else {
      return "";
    }
  }

  /**
   * Callback for when the user has left clicked to add a building.
   */
  _onLeftClick(event) {
    const self = this;

    const constructionMode = self._getConstructionSelection();

    const strategy = {
      "addSupermarket": () => self._onClickSupermarketAdd(event),
      "addFastFood": () => self._onClickFastFoodAdd(event),
      "delSupermarket": () => self._onClickSupermarketDel(event),
      "delFastFood": () => self._onClickFastFoodDel(event)
    }[constructionMode];

    strategy();
  }

  /**
   * Callback for click in the visualization canvas for supermarket.
   *
   * Callback for when the user left clicks to construct a new simulated
   * supermarket.
   */
  _onClickSupermarketAdd(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.addSupermarketAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
    
    self._constructionCost += 1;
  }

  /**
   * Callback for click in the visualization canvas for fast food.
   *
   * Callback for when the user left clicks to construct a new simulated
   * fast food.
   */
  _onClickFastFoodAdd(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.addFastFoodAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
    
    self._constructionCost += 1;
  }

  /**
   * Callback for click in the visualization canvas for deleting a supermarket.
   *
   * Callback for when the user left clicks to delete a new simulated
   * supermarket.
   */
  _onClickSupermarketDel(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.delSupermarketAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
    
    self._constructionCost += 1.2;
  }

  /**
   * Callback for click in the visualization canvas for deleteing a fast food.
   *
   * Callback for when the user left clicks to delete a new simulated
   * fast food.
   */
  _onClickFastFoodDel(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.delFastFoodAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
    
    self._constructionCost += 1.2;
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

  initTutorial(presenter);
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


/**
 * Stop displaying any tutorial overlays.
 *
 * @param presenter The presenter to manipulate.
 */
function hideAllHints(presenter) {
  presenter.clearOverlay();
  document.getElementById("controlAreaInner").className = "";
}


/**
 * Display an overlay circle over Bayview.
 *
 * @param presenter The presenter to manipulate.
 */
function showBayview(presenter) {
  presenter.addOverlay(500, 430, 40);
}

/*
 * Display an overlay circle over Hunter's Point.
 *
 * @param presenter The presenter to manipulate.
 */
function showHuntersPoint(presenter) {
  presenter.addOverlay(580, 400, 40);
}


/**
 * Display an overlay circle over Richmond.
 *
 * @param presenter The presenter to manipulate.
 */
function showMerced(presenter) {
  presenter.addOverlay(150, 455, 35);
}


/**
 * Display an overlay circle over Twin Peaks.
 *
 * @param presenter The presenter to manipulate.
 */
function showTwinPeaks(presenter) {
  presenter.addOverlay(280, 390, 60);
}


/**
 * Show an animation on the controls section.
 *
 * @param presenter The presenter to manipulate.
 */
function pulseControls(presenter) {
  document.getElementById("controlAreaInner").className = "pulse-bg";
}


/**
 * Fade in an element by CSS.
 *
 * @param targetId String ID for the element to fade in (withough #).
 */
function addFadeIn(targetId) {
  const target = document.getElementById(targetId);
  const originalClassName = target.className;
  const fadeInPresent = originalClassName.indexOf("fade-in") != -1;
  const newClassName = fadeInPresent ? originalClassName : originalClassName + " fade-in";

  target.className = newClassName;
  target.style.opacity = "1";
}


/**
 * Shortcut to show the map to the user.
 *
 * @param presenter The presenter to manipulate.
 */
function showMap(presenter) {
  addFadeIn("vizCanvas");
}


/**
 * Shortcut to let the user see the supermarket locations.
 *
 * @param presenter The presenter to manipulate.
 */
function enableSupermarkets(presenter) {
  presenter.setSupermarketEnabled(true);
}


/**
 * Shortcut to let the user see the fast food locations.
 *
 * @param presenter The presenter to manipulate.
 */
function enableFastFood(presenter) {
  presenter.setFastFoodEnabled(true);
}


function showSummary(presenter) {
  addFadeIn("summaryPanel");
}


/**
 * Shortcut to show the user the controls for the visualization.
 *
 * @param presenter The presenter to manipulate.
 */
function showControls(presenter) {
  const target = document.getElementById("goalPanel");
  target.style.display = "block";
  
  addFadeIn("constructPanel");
  addFadeIn("distancePanel");
  addFadeIn("goalPanel");
}


/**
 * Start the tutorial sequence.
 *
 * @param presenter The presenter to manipulate.
 */
function initTutorial(presenter) {

  const extraActions = {
    "step1": () => { hideAllHints(presenter); },
    "step2": () => { hideAllHints(presenter); showMap(presenter); },
    "step3": () => {
      hideAllHints(presenter);
      enableSupermarkets(presenter);
      showSummary(presenter);
      showHuntersPoint(presenter);
    },
    "step4": () => {
      hideAllHints(presenter);
      enableFastFood(presenter);
      showBayview(presenter);
    },
    "step5": () => { hideAllHints(presenter); showTwinPeaks(presenter); },
    "step6": () => { hideAllHints(presenter); showMerced(presenter); },
    "step7": () => {
      hideAllHints(presenter);
      showControls(presenter);
      pulseControls(presenter);
    },
    "step8": () => { hideAllHints(presenter); }
  };

  function addListeners(target) {
    target.addEventListener("click", (event) => {
      const currentId = target.getAttribute("current");
      document.getElementById(currentId).style.display = "none";

      const newId = target.getAttribute("href").replace("#", "");
      document.getElementById(newId).style.display = "block";

      const action = extraActions[newId];
      if (action !== undefined) {
        extraActions[newId]();
      }
    });
  }

  function skipIntro() {
    document.getElementById("skip-guide-msg").style.display = "block";
    document.getElementById("guide-contents").style.display = "none";
    showMap(presenter);
    enableSupermarkets(presenter);
    enableFastFood(presenter);
    showSummary(presenter);
    showControls(presenter);
  }

  document.querySelectorAll(".previous").forEach(addListeners);
  document.querySelectorAll(".next").forEach(addListeners);
  document.getElementById("skipGuideLink").addEventListener("click", (event) => {
    skipIntro();
  });
  document.getElementById("skip-link").addEventListener("click", (event) => {
    skipIntro();
  });
}


loadEntitySet();
