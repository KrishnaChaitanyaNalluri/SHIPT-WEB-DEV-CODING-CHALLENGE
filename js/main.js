(function() {
var CONST = {};
CONST.AVAILABLE_SHIPS = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
CONST.HUMAN_PLAYER = 0;
CONST.COMPUTER_PLAYER = 1;
CONST.VIRTUAL_PLAYER = 2;
CONST.CSS_TYPE_EMPTY = 'empty';
CONST.CSS_TYPE_SHIP = 'ship';
CONST.CSS_TYPE_MISS = 'miss';
CONST.CSS_TYPE_HIT = 'hit';
CONST.CSS_TYPE_SUNK = 'sunk';
CONST.TYPE_EMPTY = 0;
CONST.TYPE_SHIP = 1; 
CONST.TYPE_MISS = 2; 
CONST.TYPE_HIT = 3; 
CONST.TYPE_SUNK = 4; 

Game.usedShips = [CONST.UNUSED, CONST.UNUSED, CONST.UNUSED, CONST.UNUSED, CONST.UNUSED];
CONST.USED = 1;
CONST.UNUSED = 0;

// Game Constructor
function Game(size) {
	Game.size = size;
	this.shotsTaken = 0;
	this.createGrid();
	this.init();
}
Game.size = 10; // Default grid size is 10x10
Game.gameOver = false;
Game.prototype.checkIfWon = function() {
	if (this.computerFleet.allShipsSunk()) {
		alert('Win!, Please Refresh your browser to play it again');
		Game.gameOver = true;
	} else if (this.humanFleet.allShipsSunk()) {
		alert('Sunk, Please Refresh your browser to restart the game');
		Game.gameOver = true;
	}
};
// Shoots at the target player on the grid.
Game.prototype.shoot = function(x, y, targetPlayer) {
	var targetGrid;
	var targetFleet;
	if (targetPlayer === CONST.HUMAN_PLAYER) {
		targetGrid = this.humanGrid;
		targetFleet = this.humanFleet;
	} else if (targetPlayer === CONST.COMPUTER_PLAYER) {
		targetGrid = this.computerGrid;
		targetFleet = this.computerFleet;
	} else {
		console.log("There was an error trying to find the correct player to target");
	}

	if (targetGrid.isDamagedShip(x, y)) {
		return null;
	} else if (targetGrid.isMiss(x, y)) {
		return null;
	} else if (targetGrid.isUndamagedShip(x, y)) {
		targetGrid.updateCell(x, y, 'hit', targetPlayer);
		targetFleet.findShipByCoords(x, y).incrementDamage(); 
		this.checkIfWon();
		return CONST.TYPE_HIT;
	} else {
		targetGrid.updateCell(x, y, 'miss', targetPlayer);
		this.checkIfWon();
		return CONST.TYPE_MISS;
	}
};
Game.prototype.shootListener = function(e) {
	var self = e.target.self;
	// Extract coordinates from event listener
	var x = parseInt(e.target.getAttribute('data-x'), 10);
	var y = parseInt(e.target.getAttribute('data-y'), 10);
	var result = null;
	if (self.readyToPlay) {
		result = self.shoot(x, y, CONST.COMPUTER_PLAYER);
	}

	if (result !== null && !Game.gameOver) {
		self.robot.shoot();
	} else {
		Game.gameOver = false;
	}
};
// Creates click event listeners on each of the ship names in the roster
Game.prototype.rosterListener = function(e) {
	var self = e.target.self;
	var roster = document.querySelectorAll('.fleet-roster li');
	for (var i = 0; i < roster.length; i++) {
		var classes = roster[i].getAttribute('class') || '';
		classes = classes.replace('placing', '');
		roster[i].setAttribute('class', classes);
	}
	Game.placeShipType = e.target.getAttribute('id');
	document.getElementById(Game.placeShipType).setAttribute('class', 'placing');
	Game.placeShipDirection = parseInt(document.getElementById('rotate-button').getAttribute('data-direction'), 10);
	self.placingOnGrid = true;
};
Game.prototype.placementListener = function(e) {
	var self = e.target.self;
	if (self.placingOnGrid) {
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);
		
		var successful = self.humanFleet.placeShip(x, y, Game.placeShipDirection, Game.placeShipType);
		if (successful) {
			self.endPlacing(Game.placeShipType);
			self.placingOnGrid = false;
			if (self.areAllShipsPlaced()) {
				var el = document.getElementById('rotate-button');
				el.addEventListener(transitionEndEventName(),(function(){
					el.setAttribute('class', 'disable');
						document.getElementById('start-game').removeAttribute('class');	
						alert('Please click on Start Game and choose a position in Computer Grid to start playing!');
				}),false);
				el.setAttribute('class', 'invisible');
			}

		}
	}
};
Game.prototype.placementMouseover = function(e) {
	var self = e.target.self;
	if (self.placingOnGrid) {
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);
		var classes;
		var fleetRoster = self.humanFleet.fleetRoster;

		for (var i = 0; i < fleetRoster.length; i++) {
			var shipType = fleetRoster[i].type;

			if (Game.placeShipType === shipType &&
				fleetRoster[i].isLegal(x, y, Game.placeShipDirection)) {
				// Virtual ship
				fleetRoster[i].create(x, y, Game.placeShipDirection, true);
				Game.placeShipCoords = fleetRoster[i].getAllShipCells();

				for (var j = 0; j < Game.placeShipCoords.length; j++) {
					var el = document.querySelector('.grid-cell-' + Game.placeShipCoords[j].x + '-' + Game.placeShipCoords[j].y);
					classes = el.getAttribute('class');
					// Check if the substring ' grid-ship' already exists to avoid adding it twice
					if (classes.indexOf(' grid-ship') < 0) {
						classes += ' grid-ship';
						el.setAttribute('class', classes);
					}
				}
			}
		}
	}
};
Game.prototype.placementMouseout = function(e) {
	var self = e.target.self;
	if (self.placingOnGrid) {
		for (var j = 0; j < Game.placeShipCoords.length; j++) {
			var el = document.querySelector('.grid-cell-' + Game.placeShipCoords[j].x + '-' + Game.placeShipCoords[j].y);
			classes = el.getAttribute('class');
			if (classes.indexOf(' grid-ship') > -1) {
				classes = classes.replace(' grid-ship', '');
				el.setAttribute('class', classes);
			}
		}
	}
};
Game.prototype.toggleRotation = function(e) {
	var direction = parseInt(e.target.getAttribute('data-direction'), 10);
	if (direction === Ship.DIRECTION_VERTICAL) {
		e.target.setAttribute('data-direction', '1');
		Game.placeShipDirection = Ship.DIRECTION_HORIZONTAL;
	} else if (direction === Ship.DIRECTION_HORIZONTAL) {
		e.target.setAttribute('data-direction', '0');
		Game.placeShipDirection = Ship.DIRECTION_VERTICAL;
	}
};
Game.prototype.startGame = function(e) {
	var self = e.target.self;
	var el = document.getElementById('game-sidebar');
	var fn = function() {el.setAttribute('class', 'disable');};
	el.addEventListener(transitionEndEventName(),fn,false);
	el.setAttribute('class', 'invisible');
	self.readyToPlay = true;
	el.removeEventListener(transitionEndEventName(),fn,false);
};
Game.prototype.placeRandomly = function(e){
	e.target.removeEventListener(e.type, arguments.callee);
	e.target.self.humanFleet.placeShipsRandomly();
	e.target.self.readyToPlay = true;
	document.getElementById('game-sidebar').setAttribute('class', 'disable');
	this.setAttribute('class', 'disable');
};
Game.prototype.endPlacing = function(shipType) {
	document.getElementById(shipType).setAttribute('class', 'placed');
	
	Game.usedShips[CONST.AVAILABLE_SHIPS.indexOf(shipType)] = CONST.USED;

	Game.placeShipDirection = null;
	Game.placeShipType = '';
	Game.placeShipCoords = [];
};
Game.prototype.areAllShipsPlaced = function() {
	var playerRoster = document.querySelectorAll('.fleet-roster li');
	for (var i = 0; i < playerRoster.length; i++) {
		if (playerRoster[i].getAttribute('class') === 'placed') {
			continue;
		} else {
			return false;
		}
	}
	Game.placeShipDirection = 0;
	Game.placeShipType = '';
	Game.placeShipCoords = [];
	return true;
};
Game.prototype.resetFogOfWar = function() {
	for (var i = 0; i < Game.size; i++) {
		for (var j = 0; j < Game.size; j++) {
			this.humanGrid.updateCell(i, j, 'empty', CONST.HUMAN_PLAYER);
			this.computerGrid.updateCell(i, j, 'empty', CONST.COMPUTER_PLAYER);
		}
	}
	Game.usedShips = Game.usedShips.map(function(){return CONST.UNUSED;});
};

Game.prototype.createGrid = function() {
	var gridDiv = document.querySelectorAll('.grid');
	for (var grid = 0; grid < gridDiv.length; grid++) {
		for (var i = 0; i < Game.size; i++) {
			for (var j = 0; j < Game.size; j++) {
				var el = document.createElement('div');
				el.setAttribute('data-x', i);
				el.setAttribute('data-y', j);
				el.setAttribute('class', 'grid-cell grid-cell-' + i + '-' + j);
				gridDiv[grid].appendChild(el);
			}
		}
	}
};
Game.prototype.init = function() {
	this.humanGrid = new Grid(Game.size);
	this.computerGrid = new Grid(Game.size);
	this.humanFleet = new Fleet(this.humanGrid, CONST.HUMAN_PLAYER);
	this.computerFleet = new Fleet(this.computerGrid, CONST.COMPUTER_PLAYER);

	this.robot = new Computer(this);
	this.shotsTaken = 0;
	this.readyToPlay = false;
	this.placingOnGrid = false;
	Game.placeShipDirection = 0;
	Game.placeShipType = '';
	Game.placeShipCoords = [];

	var computerCells = document.querySelector('.computer-player').childNodes;
	for (var j = 0; j < computerCells.length; j++) {
		computerCells[j].self = this;
		computerCells[j].addEventListener('click', this.shootListener, false);
	}

	var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < playerRoster.length; i++) {
		playerRoster[i].self = this;
		playerRoster[i].addEventListener('click', this.rosterListener, false);
	}

	var humanCells = document.querySelector('.human-player').childNodes;
	for (var k = 0; k < humanCells.length; k++) {
		humanCells[k].self = this;
		humanCells[k].addEventListener('click', this.placementListener, false);
		humanCells[k].addEventListener('mouseover', this.placementMouseover, false);
		humanCells[k].addEventListener('mouseout', this.placementMouseout, false);
	}

	var rotateButton = document.getElementById('rotate-button');
	rotateButton.addEventListener('click', this.toggleRotation, false);
	var startButton = document.getElementById('start-game');
	startButton.self = this;
	startButton.addEventListener('click', this.startGame, false);
	var resetButton = document.getElementById('reset-stats');
	var randomButton = document.getElementById('place-randomly');
	randomButton.self = this;
	randomButton.addEventListener('click', this.placeRandomly, false);
	this.computerFleet.placeShipsRandomly();
};

// Grid Constructor
function Grid(size) {
	this.size = size;
	this.cells = [];
	this.init();
}

Grid.prototype.init = function() {
	for (var x = 0; x < this.size; x++) {
		var row = [];
		this.cells[x] = row;
		for (var y = 0; y < this.size; y++) {
			row.push(CONST.TYPE_EMPTY);
		}
	}
};

Grid.prototype.updateCell = function(x, y, type, targetPlayer) {
	var player;
	if (targetPlayer === CONST.HUMAN_PLAYER) {
		player = 'human-player';
	} else if (targetPlayer === CONST.COMPUTER_PLAYER) {
		player = 'computer-player';
	} else {
		console.log("There was an error trying to find the correct player's grid");
	}

	switch (type) {
		case CONST.CSS_TYPE_EMPTY:
			this.cells[x][y] = CONST.TYPE_EMPTY;
			break;
		case CONST.CSS_TYPE_SHIP:
			this.cells[x][y] = CONST.TYPE_SHIP;
			break;
		case CONST.CSS_TYPE_MISS:
			this.cells[x][y] = CONST.TYPE_MISS;
			break;
		case CONST.CSS_TYPE_HIT:
			this.cells[x][y] = CONST.TYPE_HIT;
			break;
		case CONST.CSS_TYPE_SUNK:
			this.cells[x][y] = CONST.TYPE_SUNK;
			break;
		default:
			this.cells[x][y] = CONST.TYPE_EMPTY;
			break;
	}
	var classes = ['grid-cell', 'grid-cell-' + x + '-' + y, 'grid-' + type];
	document.querySelector('.' + player + ' .grid-cell-' + x + '-' + y).setAttribute('class', classes.join(' '));
};
Grid.prototype.isUndamagedShip = function(x, y) {
	return this.cells[x][y] === CONST.TYPE_SHIP;
};
Grid.prototype.isMiss = function(x, y) {
	return this.cells[x][y] === CONST.TYPE_MISS;
};
Grid.prototype.isDamagedShip = function(x, y) {
	return this.cells[x][y] === CONST.TYPE_HIT || this.cells[x][y] === CONST.TYPE_SUNK;
};
//Fleet Constructor
function Fleet(playerGrid, player) {
	this.numShips = CONST.AVAILABLE_SHIPS.length;
	this.playerGrid = playerGrid;
	this.player = player;
	this.fleetRoster = [];
	this.populate();
}
Fleet.prototype.populate = function() {
	for (var i = 0; i < this.numShips; i++) {
		var j = i % CONST.AVAILABLE_SHIPS.length;
		this.fleetRoster.push(new Ship(CONST.AVAILABLE_SHIPS[j], this.playerGrid, this.player));
	}
};
Fleet.prototype.placeShip = function(x, y, direction, shipType) {
	var shipCoords;
	for (var i = 0; i < this.fleetRoster.length; i++) {
		var shipTypes = this.fleetRoster[i].type;

		if (shipType === shipTypes &&
			this.fleetRoster[i].isLegal(x, y, direction)) {
			this.fleetRoster[i].create(x, y, direction, false);
			shipCoords = this.fleetRoster[i].getAllShipCells();

			for (var j = 0; j < shipCoords.length; j++) {
				this.playerGrid.updateCell(shipCoords[j].x, shipCoords[j].y, 'ship', this.player);
			}
			return true;
		}
	}
	return false;
};
Fleet.prototype.placeShipsRandomly = function() {
	var shipCoords;
	for (var i = 0; i < this.fleetRoster.length; i++) {
		var illegalPlacement = true;
		if(this.player === CONST.HUMAN_PLAYER && Game.usedShips[i] === CONST.USED) {
			continue;
		}
		while (illegalPlacement) {
			var randomX = Math.floor(Game.size * Math.random());
			var randomY = Math.floor(Game.size * Math.random());
			var randomDirection = Math.floor(2*Math.random());
			
			if (this.fleetRoster[i].isLegal(randomX, randomY, randomDirection)) {
				this.fleetRoster[i].create(randomX, randomY, randomDirection, false);
				shipCoords = this.fleetRoster[i].getAllShipCells();
				illegalPlacement = false;
			} else {
				continue;
			}
		}
		if (this.player === CONST.HUMAN_PLAYER && Game.usedShips[i] !== CONST.USED) {
			for (var j = 0; j < shipCoords.length; j++) {
				this.playerGrid.updateCell(shipCoords[j].x, shipCoords[j].y, 'ship', this.player);
				Game.usedShips[i] = CONST.USED;
			}
		}
	}
};
Fleet.prototype.findShipByCoords = function(x, y) {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		var currentShip = this.fleetRoster[i];
		if (currentShip.direction === Ship.DIRECTION_VERTICAL) {
			if (y === currentShip.yPosition &&
				x >= currentShip.xPosition &&
				x < currentShip.xPosition + currentShip.shipLength) {
				return currentShip;
			} else {
				continue;
			}
		} else {
			if (x === currentShip.xPosition &&
				y >= currentShip.yPosition &&
				y < currentShip.yPosition + currentShip.shipLength) {
				return currentShip;
			} else {
				continue;
			}
		}
	}
	return null;
};
Fleet.prototype.findShipByType = function(shipType) {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		if (this.fleetRoster[i].type === shipType) {
			return this.fleetRoster[i];
		}
	}
	return null;
};
Fleet.prototype.allShipsSunk = function() {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		if (this.fleetRoster[i].sunk === false) {
			return false;
		}
	}
	return true;
};

// Ship object
// Constructor
function Ship(type, playerGrid, player) {
	this.damage = 0;
	this.type = type;
	this.playerGrid = playerGrid;
	this.player = player;

	switch (this.type) {
		case CONST.AVAILABLE_SHIPS[0]:
			this.shipLength = 5;
			break;
		case CONST.AVAILABLE_SHIPS[1]:
			this.shipLength = 4;
			break;
		case CONST.AVAILABLE_SHIPS[2]:
			this.shipLength = 3;
			break;
		case CONST.AVAILABLE_SHIPS[3]:
			this.shipLength = 3;
			break;
		case CONST.AVAILABLE_SHIPS[4]:
			this.shipLength = 2;
			break;
		default:
			this.shipLength = 3;
			break;
	}
	this.maxDamage = this.shipLength;
	this.sunk = false;
}
Ship.prototype.isLegal = function(x, y, direction) {
	if (this.withinBounds(x, y, direction)) {
		for (var i = 0; i < this.shipLength; i++) {
			if (direction === Ship.DIRECTION_VERTICAL) {
				if (this.playerGrid.cells[x + i][y] === CONST.TYPE_SHIP ||
					this.playerGrid.cells[x + i][y] === CONST.TYPE_MISS ||
					this.playerGrid.cells[x + i][y] === CONST.TYPE_SUNK) {
					return false;
				}
			} else {
				if (this.playerGrid.cells[x][y + i] === CONST.TYPE_SHIP ||
					this.playerGrid.cells[x][y + i] === CONST.TYPE_MISS ||
					this.playerGrid.cells[x][y + i] === CONST.TYPE_SUNK) {
					return false;
				}
			}
		}
		return true;
	} else {
		return false;
	}
};
Ship.prototype.withinBounds = function(x, y, direction) {
	if (direction === Ship.DIRECTION_VERTICAL) {
		return x + this.shipLength <= Game.size;
	} else {
		return y + this.shipLength <= Game.size;
	}
};
Ship.prototype.incrementDamage = function() {
	this.damage++;
	if (this.isSunk()) {
		this.sinkShip(false);
	}
};
Ship.prototype.isSunk = function() {
	return this.damage >= this.maxDamage;
};
Ship.prototype.sinkShip = function(virtual) {
	this.damage = this.maxDamage;
	this.sunk = true;

	if (!virtual) {
		var allCells = this.getAllShipCells();
		for (var i = 0; i < this.shipLength; i++) {
			this.playerGrid.updateCell(allCells[i].x, allCells[i].y, 'sunk', this.player);
		}
	}
};
Ship.prototype.getAllShipCells = function() {
	var resultObject = [];
	for (var i = 0; i < this.shipLength; i++) {
		if (this.direction === Ship.DIRECTION_VERTICAL) {
			resultObject[i] = {'x': this.xPosition + i, 'y': this.yPosition};
		} else {
			resultObject[i] = {'x': this.xPosition, 'y': this.yPosition + i};
		}
	}
	return resultObject;
};
Ship.prototype.create = function(x, y, direction, virtual) {
	this.xPosition = x;
	this.yPosition = y;
	this.direction = direction;

	if (!virtual) {
		for (var i = 0; i < this.shipLength; i++) {
			if (this.direction === Ship.DIRECTION_VERTICAL) {
				this.playerGrid.cells[x + i][y] = CONST.TYPE_SHIP;
			} else {
				this.playerGrid.cells[x][y + i] = CONST.TYPE_SHIP;
			}
		}
	}
	
};
Ship.DIRECTION_VERTICAL = 0;
Ship.DIRECTION_HORIZONTAL = 1;

function Computer(gameObject) {
	this.gameObject = gameObject;
	this.virtualGrid = new Grid(Game.size);
	this.virtualFleet = new Fleet(this.virtualGrid, CONST.VIRTUAL_PLAYER);

	this.probGrid = [];
	this.initProbs();
	this.updateProbs();
}
Computer.PROB_WEIGHT = 5000; 
Computer.OPEN_HIGH_MIN = 20;
Computer.OPEN_HIGH_MAX = 30;
Computer.OPEN_MED_MIN = 15;
Computer.OPEN_MED_MAX = 25;
Computer.OPEN_LOW_MIN = 10;
Computer.OPEN_LOW_MAX = 20;
Computer.RANDOMNESS = 0.1;
Computer.OPENINGS = [
	{'x': 7, 'y': 3, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 6, 'y': 2, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 3, 'y': 7, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 2, 'y': 6, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 6, 'y': 6, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 3, 'y': 3, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 5, 'y': 5, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 4, 'y': 4, 'weight': getRandom(Computer.OPEN_LOW_MIN, Computer.OPEN_LOW_MAX)},
	{'x': 0, 'y': 8, 'weight': getRandom(Computer.OPEN_MED_MIN, Computer.OPEN_MED_MAX)},
	{'x': 1, 'y': 9, 'weight': getRandom(Computer.OPEN_HIGH_MIN, Computer.OPEN_HIGH_MAX)},
	{'x': 8, 'y': 0, 'weight': getRandom(Computer.OPEN_MED_MIN, Computer.OPEN_MED_MAX)},
	{'x': 9, 'y': 1, 'weight': getRandom(Computer.OPEN_HIGH_MIN, Computer.OPEN_HIGH_MAX)},
	{'x': 9, 'y': 9, 'weight': getRandom(Computer.OPEN_HIGH_MIN, Computer.OPEN_HIGH_MAX)},
	{'x': 0, 'y': 0, 'weight': getRandom(Computer.OPEN_HIGH_MIN, Computer.OPEN_HIGH_MAX)}
];
Computer.prototype.shoot = function() {
	var maxProbability = 0;
	var maxProbCoords;
	var maxProbs = [];
	
	for (var i = 0; i < Computer.OPENINGS.length; i++) {
		var cell = Computer.OPENINGS[i];
		if (this.probGrid[cell.x][cell.y] !== 0) {
			this.probGrid[cell.x][cell.y] += cell.weight;
		}
	}

	for (var x = 0; x < Game.size; x++) {
		for (var y = 0; y < Game.size; y++) {
			if (this.probGrid[x][y] > maxProbability) {
				maxProbability = this.probGrid[x][y];
				maxProbs = [{'x': x, 'y': y}];
			} else if (this.probGrid[x][y] === maxProbability) {
				maxProbs.push({'x': x, 'y': y});
			}
		}
	}

	maxProbCoords = Math.random() < Computer.RANDOMNESS ?
	maxProbs[Math.floor(Math.random() * maxProbs.length)] :
	maxProbs[0];

	var result = this.gameObject.shoot(maxProbCoords.x, maxProbCoords.y, CONST.HUMAN_PLAYER);
	
	if (Game.gameOver) {
		Game.gameOver = false;
		return;
	}

	this.virtualGrid.cells[maxProbCoords.x][maxProbCoords.y] = result;

	if (result === CONST.TYPE_HIT) {
		var humanShip = this.findHumanShip(maxProbCoords.x, maxProbCoords.y);
		if (humanShip.isSunk()) {
			var shipTypes = [];
			for (var k = 0; k < this.virtualFleet.fleetRoster.length; k++) {
				shipTypes.push(this.virtualFleet.fleetRoster[k].type);
			}
			var index = shipTypes.indexOf(humanShip.type);
			this.virtualFleet.fleetRoster.splice(index, 1);

			var shipCells = humanShip.getAllShipCells();
			for (var _i = 0; _i < shipCells.length; _i++) {
				this.virtualGrid.cells[shipCells[_i].x][shipCells[_i].y] = CONST.TYPE_SUNK;
			}
		}
	}
	this.updateProbs();
};
Computer.prototype.updateProbs = function() {
	var roster = this.virtualFleet.fleetRoster;
	var coords;
	this.resetProbs();
	for (var k = 0; k < roster.length; k++) {
		for (var x = 0; x < Game.size; x++) {
			for (var y = 0; y < Game.size; y++) {
				if (roster[k].isLegal(x, y, Ship.DIRECTION_VERTICAL)) {
					roster[k].create(x, y, Ship.DIRECTION_VERTICAL, true);
					coords = roster[k].getAllShipCells();
					if (this.passesThroughHitCell(coords)) {
						for (var i = 0; i < coords.length; i++) {
							this.probGrid[coords[i].x][coords[i].y] += Computer.PROB_WEIGHT * this.numHitCellsCovered(coords);
						}
					} else {
						for (var _i = 0; _i < coords.length; _i++) {
							this.probGrid[coords[_i].x][coords[_i].y]++;
						}
					}
				}
				if (roster[k].isLegal(x, y, Ship.DIRECTION_HORIZONTAL)) {
					roster[k].create(x, y, Ship.DIRECTION_HORIZONTAL, true);
					coords = roster[k].getAllShipCells();
					if (this.passesThroughHitCell(coords)) {
						for (var j = 0; j < coords.length; j++) {
							this.probGrid[coords[j].x][coords[j].y] += Computer.PROB_WEIGHT * this.numHitCellsCovered(coords);
						}
					} else {
						for (var _j = 0; _j < coords.length; _j++) {
							this.probGrid[coords[_j].x][coords[_j].y]++;
						}
					}
				}

				if (this.virtualGrid.cells[x][y] === CONST.TYPE_HIT) {
					this.probGrid[x][y] = 0;
				}
			}
		}
	}
};
Computer.prototype.initProbs = function() {
	for (var x = 0; x < Game.size; x++) {
		var row = [];
		this.probGrid[x] = row;
		for (var y = 0; y < Game.size; y++) {
			row.push(0);
		}
	}
};
Computer.prototype.resetProbs = function() {
	for (var x = 0; x < Game.size; x++) {
		for (var y = 0; y < Game.size; y++) {
			this.probGrid[x][y] = 0;
		}
	}
};
Computer.prototype.metagame = function() {
};
// Finds a human ship by coordinates
// Returns Ship
Computer.prototype.findHumanShip = function(x, y) {
	return this.gameObject.humanFleet.findShipByCoords(x, y);
};
Computer.prototype.passesThroughHitCell = function(shipCells) {
	for (var i = 0; i < shipCells.length; i++) {
		if (this.virtualGrid.cells[shipCells[i].x][shipCells[i].y] === CONST.TYPE_HIT) {
			return true;
		}
	}
	return false;
};
Computer.prototype.numHitCellsCovered = function(shipCells) {
	var cells = 0;
	for (var i = 0; i < shipCells.length; i++) {
		if (this.virtualGrid.cells[shipCells[i].x][shipCells[i].y] === CONST.TYPE_HIT) {
			cells++;
		}
	}
	return cells;
};

// Start the game
var mainGame = new Game(10);

})();
function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement, fromIndex) {
		var k;
		if (this === null || this === undefined) {
			throw new TypeError('"this" is null or not defined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = +fromIndex || 0;

		if (Math.abs(n) === Infinity) {
			n = 0;
		}
		if (n >= len) {
			return -1;
		}
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			var kValue;
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

if (!Array.prototype.map) {

	Array.prototype.map = function(callback, thisArg) {

		var T, A, k;

		if (this == null) {
			throw new TypeError(" this is null or not defined");
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (typeof callback !== "function") {
			throw new TypeError(callback + " is not a function");
		}
		if (arguments.length > 1) {
			T = thisArg;
		}
		A = new Array(len);
		k = 0;
		while (k < len) {

			var kValue, mappedValue;
			if (k in O) {
				kValue = O[k];
				mappedValue = callback.call(T, kValue, k, O);
				A[k] = mappedValue;
			}
			k++;
		}
		return A;
	};
}
function transitionEndEventName() {
	var i,
		undefined,
		el = document.createElement('div'),
		transitions = {
			'transition':'transitionend',
			'OTransition':'otransitionend', 
			'MozTransition':'transitionend',
			'WebkitTransition':'webkitTransitionEnd'
		};

	for (i in transitions) {
		if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
			return transitions[i];
		}
	}
}


