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