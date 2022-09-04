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

exports.ColonyBuilder = {
	"segment": ["work", "carry", "move"],
	"min": {
		"work": 2,
		"carry": 1,
		"move": 1
	},
	"max": {
		"work": 10,
		"carry": 20,
		"move": 15
	}
};

exports.Upgrader = {
	"segment": ["work", "carry", "move"],
	"min": {
		"work": 2,
		"carry": 1,
		"move": 1
	},
	"max": {
		"work": 20,
		"carry": 2,
		"move": 6
	}
};

exports.UpgradeFeeder = {
	"segment": ["carry", "carry", "move"],
	"min": {
		"carry": 2,
		"move": 1
	},
	"max": {
		"carry": 10,
		"move": 5
	}
}


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
		"work": 2,
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
		"carry": 4,
		"move": 2
	},
	"max": {
		"carry": 12,
		"move": 6
	}
}

exports.MineralMiner = {
	"segment": ["work", "carry", "move"],
	"min": {
		"work": 2,
		"carry": 1,
		"move": 1
	},
	"max": {
		"work": 24,
		"carry": 2,
		"move": 13
	}
}

exports.MineralHauler = {
	"segment": ["carry", "move"],
	"min": {
		"carry": 4,
		"move": 2
	},
	"max": {
		"carry": 8,
		"move": 4
	}
}

exports.TowerFiller = {
	"segment": ["carry", "move"],
	"min": {
		"carry": 2,
		"move": 1
	},
	"max": {
		"carry": 4,
		"move": 2
	}
}

exports.Balancer = {
	"segment": ["carry", "carry", "move"],
	"min": {
		"carry": 4,
		"move": 2
	},
	"max": {
		"carry": 8,
		"move": 4
	}
}

exports.InvaderDefender = {
	"segment": ["tough", "ranged_attack", "move", "move"],
	"min": {
		"tough": 1,
		"ranged_attack": 1,
		"move": 2
	},
	"max": {
		"tough": 10,
		"ranged_attack": 10,
		"move": 20
	}
}

exports.ToughMelee = {
	"segment": ["tough", "attack", "move", "move"],
	"min": {
		"tough": 5,
		"attack": 5,
		"move": 10
	},
	"max": {
		"tough": 10,
		"attack": 10,
		"move": 20
	}
}

exports.Melee = {
	"segment": ["attack", "move"],
	"min": {
		"attack": 10,
		"move": 10
	},
	"max": {
		"attack": 25,
		"move": 25
	}
}

exports.Healer = {
	"segment": ["heal", "move"],
	"min": {
		"heal": 6,
		"move": 6
	},
	"max": {
		"heal": 25,
		"move": 25
	}
}