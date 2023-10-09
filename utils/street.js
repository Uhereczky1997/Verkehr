var timeInstances = [];
var cars = [];
var exits = [];
var street = {
  currentCars: [],
  currentTime: 1,
  lengthh: 0,
};
var carStats = {};
var waitingCars = [];
const reset = () => {
  street = {
    currentCars: [],
    currentTime: 1,
    lengthh: 0,
  };
  timeInstances = [];
  cars = [];
  carStats = {};
  exits = [];
  waitingCars = [];
};
const placeCars = () => {
  waitingCars = waitingCars.sort((a, b) => {
    if (a.start_position > b.start_position) {
      return -1;
    } else if (a.start_position < b.start_position) {
      return 1;
    } else return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  if (!waitingCars) throw new Error("There are no waiting cars");
  console.log(waitingCars);
  waitingCars.forEach((e) => {
    if (Number(e.skip) < street.currentTime) {
      if (!isCarOnTheStreet(e.id)) {
        if (canCarBePlaced(e.id)) {
          street.currentCars[e.start_position - 1] = e.id;
          waitingCars = waitingCars.filter((d) => d.id !== e.id);
        }
      }
    }
  });
};
const getCarPosition = (id) => {
  const carIndex = street.currentCars.findIndex((e) => e === id);

  if (carIndex >= 0) {
    return carIndex;
  } else throw new Error("Car is with id: " + id + " not on the street");
};
const canCarBePlaced = (id) => {
  const car = getCar(id);
  const position = Number(car.start_position - 1);
  return (
    street.currentCars[position] === 0 && street.currentCars[position + 1] === 0
  );
};
const canCarMove = (id) => {
  //console.log(id, hasCarMoves(id));
  if (hasCarMoves(id)) {
    const position = getCarPosition(id);
    return (
      street.currentCars[position + 1] === 0 &&
      street.currentCars[position + 2] === 0
    );
  }
  return false;
};
const isCarExiting = (id) => {
  const car = getCar(id);
  return getCarPosition(id) >= Number(car.end_position - 1);
};
const isCarOnTheStreet = (id) => {
  return street.currentCars.find((e) => e === id) ? true : false;
};

const getCar = (id) => {
  return cars.find((e) => {
    return e.id === id;
  });
};
const hasCarMoves = (id) => {
  const car = carStats[`${id}`];

  if (car) {
    return car.moves < car.speed;
  } else {
    throw new Error("Cannot find car");
  }
};
const resetMoves = () => {
  cars.forEach((e) => (carStats[`${e.id}`].moves = 0));
};
const removeCar = (id) => {
  const position = getCarPosition(id);
  exits.push({ carId: id, finish: street.currentTime });
  street.currentCars[position] = 0;
};
const incrementCarMoves = (id) => {
  carStats[`${id}`].moves += 1;
};
const mapCars = () => {
  cars.forEach((e) => {
    carStats[`${e.id}`] = {
      id: Number(e.id),
      speed: Number(e.speed),
      moves: 0,
    };
  });
};
const initializeStreet = async (cars1, street1) => {
  cars = cars1.map((e) => {
    return {
      id: Number(e.id),
      start_position: Number(e.start_position),
      end_position: Number(e.end_position),
      skip: Number(e.skip),
      speed: Number(e.speed),
    };
  });
  mapCars();
  waitingCars = [...cars];
  var i = 0;
  street.lengthh = street1.length;
  for (i = 0; i <= street.lengthh; i++) {
    street.currentCars[i] = 0;
  }
  placeCars();
  console.log(waitingCars);
  console.log(carStats);
  console.log(street);
};
const moveCar = (id) => {
  const position = getCarPosition(id);
  if (position + 1 > street.lengthh)
    throw new Error(
      "Car with id:" + id + " should be removed, it exeeds the street lengthh  "
    );
  street.currentCars[position] = 0;
  street.currentCars[position + 1] = id;
  incrementCarMoves(id);
};
const takeTurn = () => {
  console.log(street);

  restart = true;
  finished = false;
  var currentCar;
  var j = 0;
  var i;
  while (!finished) {
    while (restart) {
      restart = false;
      j++;
      if (j > 5000) throw new Error("Error in take turn");
      for (i = street.lengthh; i >= 0; i--) {
        currentCar = street.currentCars[i];
        if (currentCar !== 0) {
          //console.log(currentCar);
          if (isCarExiting(currentCar)) {
            removeCar(currentCar);
            placeCars();
            restart = true;
            break;
          } else if (canCarMove(currentCar)) {
            moveCar(currentCar);
            placeCars();
            restart = true;
            break;
          }
        }
      }
    }
    finished = true;
  }
  street.currentTime += 1;
  resetMoves();
  placeCars();
  //console.log(carStats);
};
const calculateTraffic = async (pool) => {
  reset();
  var cars1 = await pool.query("select * from car");
  cars1 = cars1.rows;
  var street1 = await pool.query("select * from street");
  street1 = street1.rows[0];
  await initializeStreet(cars1, street1);
  var j = 0;
  while (street.currentCars.find((e) => e !== 0) || waitingCars.length > 0) {
    j++;
    if (j > 2000) throw new Error("Error in while");
    takeTurn();
  }
  return {
    finish: street.currentTime - 1,
    finishTimes: exits,
  };
};

module.exports = {
  calculateTraffic,
};
