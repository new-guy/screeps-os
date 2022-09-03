// Priorities
HIGHEST_PROMOTABLE_PRIORITY = 100;
COLONY_BALANCER_PRIORITY = 99;
COLONY_DEFENSE_PRIORITY = 98;
COLONY_OFFENSE_PRIORITY = 97;
COLONY_ADJACENT_SCOUT_PRIORITY = 96;
COLONY_MANAGEMENT_PRIORITY = 95;
COLONY_NECESSARY_ENERGY_PRIORITY = 94;
COLONY_SCOUTING_PRIORITY = 91;
COLONY_BUILDER_PRIORITY = 90;
COLONY_EXPANSION_SUPPORT = 75;
ROOM_UPGRADE_CREEPS_PRIORITY = 65;
COLONY_EXTRA_ENERGY_PRIORITY = 60;
COLONY_MINERAL_PRIORITY = 59;
COLONY_NONESSENTIAL_PRIORITY = 50;
DEFAULT_PRIORITY = 10;

// CPU Management
CPU_BUCKET_LOW_WATERMARK = 2000;
CPU_BUCKET_HIGH_WATERMARK = 8000;

CPU_ABOVE_HIGH_PERCENT = 0.8;
CPU_DEFAULT_PERCENT = 0.9;
CPU_BELOW_LOW_PERCENT = 0.5;

CPU_TICKS_SINCE_NOT_FULL_TO_GENERATE_PIXEL = 100

// Recon
COLONY_DEFAULT_SCOUT_INTERVAL = 4000;
COLONY_DISTANCE_SCOUT_INTERVAL = {
    "1": 50,
    "2": 2000,
    "3": COLONY_DEFAULT_SCOUT_INTERVAL
};
COLONY_ROOM_INFO_UPDATE_INTERVAL = 1000;

ROOM_IS_DANGEROUS_TIMEOUT = 2000;

// Navigation
MIN_DIST_FROM_SK = 5;

//IDK LIKE FUCKIN STUFF OR WHATEVER
SMALL_BALANCER_CARRY_PARTS = 4; //If it's less than or equal to this, the balancer is considered small, which means it gets killed if the room is full on its balancer :)


// Mining route configuration
MAX_TICKS_TO_USE_PER_SPAWN = 700;
TARGET_ROUTES_PER_STORAGE = 5;
TIME_BETWEEN_PURGES = 3000;
DEFAULT_ENERGY_HAULER_COUNT = 2;
DIST_PER_HAULER_POST_STORAGE = 50; //After we've gotten storage, scale the hauler count based upon distance?
REMAINING_TICKS_TO_SPAWN_RESERVER = 3000;


// Expansion Configuration
EXPANSION_BOOTSTRAP_MAX_COUNT = 5
EXPANSION_BOOTSTRAP_MAX_TICKS = 500
EXPANSION_BOOTSTRAP_MAX_ENERGY = 5000

//Stat tracking Configuration
RCL_RECORD_FREQUENCY = 100 //Every N ticks, record the current RCL %
RCL_TICKS_TO_LOOK_BACK_1 = 700 //Number of ticks to look back when showing a delta line 1
RCL_TICKS_TO_LOOK_BACK_2 = 9200 //Number of ticks to look back when showing a delta line 2
APPROX_SEC_PER_TICK = 5 //Seconds per tick

//Resource Management
ROOM_OWN_MINERAL_MINING_TARGET = 50000 //Amount of mineral in the room that we should aim to harvest and put in the storage

// Colony configuration
VALID_STRUCTURES_TO_RAMPART = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_LINK, STRUCTURE_TERMINAL, STRUCTURE_TOWER, STRUCTURE_STORAGE];

COLONY_MAX_RANGE = 2;
COLONY_MAX_ROOMS_TO_TRAVEL = 2;
COLONY_INFO_UPDATE_FREQUENCY = 500; //Update every N ticks
COLONY_ROAD_HITS_CRITICAL_THRESHOLD = 0.4;

COLONY_MAX_BUILDER_COUNT = 3;
COLONY_MAX_ROAD_REPAIRERS = 2;

ENERGY_PER_EXTRA_UPGRADER = 30000;

DOWNGRADE_TICKS_SAFEGUARD = 1000;
BOOTSTRAPPER_SAVE_CONTROLLER_THRESHOLD = 3000;

ROOM_NECESSARY_MINIMUM_ENERGY_CONTAINER = 1000;
ROOM_NECESSARY_MINIMUM_ENERGY_STORAGE = 50000;
HAUL_ENERGY_LOW_THRESHOLD_STORAGE = 10000; //If it's below this threshold, and the other room is above minimum energy storage threshold, then transfer from one to the other

TICKS_BETWEEN_FULL_ROAD_RECALCULATION = 3000;

COMA_RECOVERY_CREEPS_TO_SPAWN = 5;
COMA_WORK_PARTS_FOR_SAFE = 3;
COMA_MINIMUM_ENERGY_FOR_SAFE = 10000;

PRE_STORAGE_BOOTSTRAPPER_MAX = 25;
PRE_STORAGE_BOOTSTRAPPER_MAX_TICKS = 700; //1500 ticks per life
PRE_STORAGE_BOOTSTRAPPER_MAX_ENERGY = 4000; //800 * 5 (arbitrary)

FULL_CONTAINER_UPGRADER_COUNT = 3; //How many upgraders to spawn when the container is full and we're pre-storage
FULL_CONTAINER_UPGRADE_FEEDER_COUNT = 3;

HEART_MAX_DISTANCE = 15;
SECONDARY_MAX_STEPS_TO_PRIMARY = 1;

STRUCTURE_BUILD_PRIORITY = [
    STRUCTURE_SPAWN,
    STRUCTURE_LINK,
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
    "6": 250000,
    "7": 1000000,
    "8": 25000000
};