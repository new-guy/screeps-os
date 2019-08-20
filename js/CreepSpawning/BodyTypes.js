exports.BootStrapper = {
	"segment": ["work", "carry", "move", "move"],
	"min": {
		"work": 1,
		"carry": 1,
		"move": 2
	},
	"max": {
		"work": 5,
		"carry": 5,
		"move": 10
	}
};

exports.Builder = {
	"segment": ["work", "carry", "move"],
	"min": {
		"work": 1,
		"carry": 1,
		"move": 1
	},
	"max": {
		"work": 10,
		"carry": 10,
		"move": 10
	}
};

exports.Upgrader = {
	"segment": ["work", "carry", "move"],
	"min": {
		"work": 1,
		"carry": 1,
		"move": 1
	},
	"max": {
		"work": 20,
		"carry": 2,
		"move": 6
	}
};


exports.Scout = {
	"segment": ["move"],
	"min": {
		"move": 1
	},
	"max": {
		"move": 1
	}
}

exports.Claimer = {
	"segment": ["move", "claim"],
	"min": {
		"move": 1,
		"claim": 1
	},
	"max": {
		"move": 5,
		"claim": 1
	}
}

exports.Reserver = {
	"segment": ["move", "move", "claim", "claim"],
	"min": {
		"move": 2,
		"claim": 2
	},
	"max": {
		"move": 2,
		"claim": 2
	}
}

exports.Miner = {
	"segment": ["work", "carry", "move"],
	"min": {
		"work": 1,
		"carry": 1,
		"move": 1
	},
	"max": {
		"work": 8,
		"carry": 2,
		"move": 5
	}
}

exports.Hauler = {
	"segment": ["carry", "move"],
	"min": {
		"carry": 1,
		"move": 1
	},
	"max": {
		"carry": 10,
		"move": 10
	}
}

exports.Balancer = {
	"segment": ["carry", "carry", "move"],
	"min": {
		"carry": 2,
		"move": 1
	},
	"max": {
		"carry": 4,
		"move": 2
	}
}