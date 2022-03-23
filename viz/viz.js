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
    const latLngSpace = rawProjectReverse(metersSpace);

    self._entitySet.addSupermarketAt(
      latLngSpace["longitude"],
      latLngSpace["latitude"]
    );
  }

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
