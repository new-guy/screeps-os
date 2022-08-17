//Priorities
HIGHEST_PROMOTABLE_PRIORITY = 100;
COLONY_BALANCER_PRIORITY = 95;
COLONY_DEFENSE_PRIORITY = 94;
COLONY_ADJACENT_SCOUT_PRIORITY = 91;
COLONY_MANAGEMENT_PRIORITY = 90;
COLONY_NECESSARY_ENERGY_PRIORITY = 87;
COLONY_SCOUTING_PRIORITY = 82;
COLONY_BUILDER_PRIORITY = 70;
ROOM_UPGRADE_CREEPS_PRIORITY = 65;
COLONY_EXTRA_ENERGY_PRIORITY = 60;
COLONY_EXPANSION_SUPPORT = 55;
COLONY_NONESSENTIAL_PRIORITY = 50;
DEFAULT_PRIORITY = 10;

//Recon
COLONY_DEFAULT_SCOUT_INTERVAL = 4000;
COLONY_DISTANCE_SCOUT_INTERVAL = {
    "1": 50,
    "2": 2000,
    "3": COLONY_DEFAULT_SCOUT_INTERVAL
};
COLONY_ROOM_INFO_UPDATE_INTERVAL = 1000;

ROOM_IS_DANGEROUS_TIMEOUT = 2000;


//IDK LIKE FUCKIN STUFF OR WHATEVER
SMALL_BALANCER_CARRY_PARTS = 4; //If it's less than or equal to this, the balancer is considered small, which means it gets killed if the room is full on its balancer :)


// Mining route configuration
MAX_TICKS_TO_USE_PER_SPAWN = 700;
TARGET_ROUTES_PER_STORAGE = 5;
TIME_BETWEEN_PURGES = 500;
HAULER_COUNT = 2;
REMAINING_TICKS_TO_SPAWN_RESERVER = 3000;


// Expansion Configuration
EXPANSION_BOOTSTRAP_MAX_COUNT = 10
EXPANSION_BOOTSTRAP_MAX_TICKS = 500
EXPANSION_BOOTSTRAP_MAX_ENERGY = 5000

// Colony configuration
COLONY_MAX_RANGE = 2;
COLONY_MAX_ROOMS_TO_TRAVEL = 2;
COLONY_INFO_UPDATE_FREQUENCY = 200; //Update every N ticks
COLONY_ROAD_HITS_CRITICAL_THRESHOLD = 0.2;

COLONY_MAX_BUILDER_COUNT = 4;

ENERGY_PER_EXTRA_UPGRADER = 100000;

DOWNGRADE_TICKS_SAFEGUARD = 1000;
BOOTSTRAPPER_SAVE_CONTROLLER_THRESHOLD = 3000;

ROOM_NECESSARY_MINIMUM_ENERGY_CONTAINER = 1000;
ROOM_NECESSARY_MINIMUM_ENERGY_STORAGE = 20000;

TICKS_BETWEEN_FULL_ROAD_RECALCULATION = 100;

COMA_RECOVERY_CREEPS_TO_SPAWN = 5;
COMA_WORK_PARTS_FOR_SAFE = 3;
COMA_MINIMUM_ENERGY_FOR_SAFE = 10000;

PRE_RCL3_BOOTSTRAPPER_MAX = 15; //Pre-RCL3 in the spawn colony - we do this to enable the first colony to start faster
PRE_RCL3_BOOTSTRAPPER_MAX_SPAWN_TICKS = 800; //1500 ticks per life
PRE_STORAGE_BOOTSTRAPPER_MAX = 10;
PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS = 700; //1500 ticks per life
FULL_CONTAINER_UPGRADER_COUNT = 3; //How many upgraders to spawn when the container is full and we're pre-storage
FULL_CONTAINER_UPGRADE_FEEDER_COUNT = 2;

STRUCTURE_BUILD_PRIORITY = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_CONTAINER
];

STRUCTURE_REMOVE_PRIORITY = [
    STRUCTURE_EXTENSION,
    STRUCTURE_LINK,
    STRUCTURE_TOWER,
    STRUCTURE_LAB,
    STRUCTURE_OBSERVER,
    STRUCTURE_NUKER,
    STRUCTURE_TERMINAL,
    STRUCTURE_STORAGE,
    STRUCTURE_SPAWN
];

// Room defense configuration
DEFENSE_UPGRADE_SCHEDULE = {
    "1": 5000,
    "2": 5000,
    "3": 10000,
    "4": 25000,
    "5": 50000,
    "6": 150000,
    "7": 1000000,
    "8": 25000000
};