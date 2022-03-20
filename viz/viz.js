class Entity {

  constructor(longitude, latitude, type, state, updating) {
    const self = this;
    self._longitude = longitude;
    self._latitude = latitude;

    const projected = project(longitude, latitude);
    self._x = projected["x"];
    self._y = projected["y"];

    self._type = type;
    self._state = state;
    self._updating = updating;
  }

  getLongitude() {
    const self = this;
    return self._longitude;
  }

  getLatitude() {
    const self = this;
    return self._latitude;
  }

  getX() {
    const self = this;
    return self._x;
  }

  getY() {
    const self = this;
    return self._y;
  }

  getType() {
    const self = this;
    return self._type;
  }

  getState() {
    const self = this;
    return self._state;
  }

  setState(newState) {
    const self = this;
    self._state = newState;
  }

  getIsUpdating() {
    const self = this;
    return self._updating;
  }

  setUpdating(updating) {
    const self = this;
    self._updating = updating;
  }

}


class EntitySet {

  constructor(homes, fastFoods, supermarkets) {
    const self = this;
    self._homes = homes;
    self._fastFoods = fastFoods;
    self._supermarkets = supermarkets;
    self._allowedDistanceDisparity = 1;
  }

  getHomes() {
    const self = this;
    return self._homes;
  }

  getFastFoods() {
    const self = this;
    return self._fastFoods;
  }

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

  getSupermarkets() {
    const self = this;
    return self._supermarkets;
  }

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

  updateHomes() {
    const self = this;
    const waiting = self._homes.filter((x) => x.getIsUpdating());
    const toUpdate = waiting.slice(0, 100);
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
      {"x": a.getLongitude(), "y": a.getLatitude()},
      {"x": b.getLongitude(), "y": b.getLatitude()}
    );
  }

  _setAllHomesUpdating() {
    const self = this;
    self._homes.forEach((x) => {x.setUpdating(true);});
  }

}


class Presenter {

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

  draw() {
    const self = this;

    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);

    self._entitySet.getHomes().forEach((home) => {
      const color = {
        "unknown": "#EAEAEA",
        "supermarket": "#A6CEE3",
        "fastFood": "#B2DF8A"
      }[home.getState()];
      self._ring(home.getX(), home.getY(), 3, color);
    });

    self._entitySet.getFastFoods().forEach((fastFood) => {
      self._ellipse(fastFood.getX(), fastFood.getY(), 5, "#33A02C");
    });

    self._entitySet.getSupermarkets().forEach((supermarket) => {
      self._ellipse(supermarket.getX(), supermarket.getY(), 5, "#1F78B4");
    });
  }

  update() {
    const self = this;

    const hasUpdates = self._entitySet.updateHomes();
    if (hasUpdates) {
      self.draw();
      self._updateSummary();
    }
  }

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

  _onTolleranceChange() {
    const self = this;
    self._entitySet.setDistanceDisparity(self._allowedTolleranceSlider.value);
    self._updateTolleranceDisplay();
  }

  _updateTolleranceDisplay() {
    const self = this;
    const allowed = Math.round(
      (self._allowedTolleranceSlider.value - 1) * 20
    ) / 20 * 100;
    const isPos = allowed > 0;
    const allowedStr = isPos ? "+" + allowed : allowed;
    self._allowedTolleranceDisplay.innerHTML = allowedStr + "%";
  }

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

  _onLeftClick(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace["y"], metersSpace["x"]);

    self._entitySet.addSupermarketAt(latLngSpace["x"], latLngSpace["y"]);
  }

  _onRightClick(event) {
    const self = this;

    const mousePosition = self._getMousePos(event);
    const metersSpace = translateScalePointReverse(mousePosition);
    const latLngSpace = rawProjectReverse(metersSpace["y"], metersSpace["x"]);

    self._entitySet.addFastFoodAt(latLngSpace["x"], latLngSpace["y"]);
  }

  _getMousePos(event) {
    const self = this;
    const rect = self._canvas.getBoundingClientRect();
    return {
      "x": event.clientX - rect.left,
      "y": event.clientY - rect.top
    };
  }

}


function forceFloat(target) {
  if (typeof target === "string") {
    return parseFloat(target);
  } else {
    return target;
  }
}


function isValid(target) {
  return target !== undefined && isFinite(target);
}


function shuffle(target) {
  // Thanks stackoverflow.com/questions/2450954
  return target
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}


function startDrawLoop(presenter) {
  setInterval(() => {
    presenter.update();
  }, 150);
}


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


function loadEntitySet() {
  Papa.parse("./combined.csv", {
    download: true,
    complete: onEntityLoad,
    header: true
  });
}


loadEntitySet();
