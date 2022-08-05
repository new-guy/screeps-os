//Priorities
HIGHEST_PROMOTABLE_PRIORITY = 100;
COLONY_ADJACENT_SCOUT_PRIORITY = 91;
COLONY_MANAGEMENT_PRIORITY = 90;
COLONY_NECESSARY_ENERGY_PRIORITY = 87;
COLONY_DEFENSE_PRIORITY = 85;
COLONY_SCOUTING_PRIORITY = 82;
COLONY_BUILDER_PRIORITY = 70;
ROOM_UPGRADE_CREEPS_PRIORITY = 65;
COLONY_EXTRA_ENERGY_PRIORITY = 60;
COLONY_EXPANSION_SUPPORT = 55;
COLONY_NONESSENTIAL_PRIORITY = 50;
DEFAULT_PRIORITY = 10;


//IDK LIKE FUCKIN STUFF OR WHATEVER
SMALL_BALANCER_CARRY_PARTS = 4; //If it's less than or equal to this, the balancer is considered small, which means it gets killed if the room is full on its balancer :)


// Mining route configuration
MAX_TICKS_TO_USE_PER_SPAWN = 700;
TARGET_ROUTES_PER_STORAGE = 5;
TIME_BETWEEN_PURGES = 1500;
HAULER_COUNT = 2;
REMAINING_TICKS_TO_SPAWN_RESERVER = 3000;


// Colony configuration
COLONY_MAX_RANGE = 2;
COLONY_MAX_ROOMS_TO_TRAVEL = 2;
COLONY_INFO_UPDATE_FREQUENCY = 200; //Update every N ticks
COLONY_ROAD_HITS_CRITICAL_THRESHOLD = 0.2;

ENERGY_PER_EXTRA_UPGRADER = 100000;

DOWNGRADE_TICKS_SAFEGUARD = 1000;

ROOM_UPGRADE_MINIMUM_ENERGY_CONTAINER = 1000;
ROOM_UPGRADE_MINIMUM_ENERGY_STORAGE = 20000;

TICKS_BETWEEN_ROAD_CONSTRUCTION_SITE_UPDATES = 100;
TICKS_BETWEEN_FULL_ROAD_RECALCULATION = 1500;

COMA_RECOVERY_CREEPS_TO_SPAWN = 5;
COMA_WORK_PARTS_FOR_SAFE = 3;
COMA_MINIMUM_ENERGY_FOR_SAFE = 10000;

PRE_STORAGE_BOOTSTRAPPER_MAX = 10;
PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS = 500; //1500 ticks per life

// Room defense configuration
DEFENSE_UPGRADE_SCHEDULE = {
    "1": 5000,
    "2": 5000,
    "3": 20000,
    "4": 50000,
    "5": 150000,
    "6": 500000,
    "7": 1500000,
    "8": 25000000
};