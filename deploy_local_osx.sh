#!/bin/bash

rm -rf ./dist || true

mkdir ./dist

find ./js -name '*.js' -exec cp {} ./dist \;

rm -rf "/Users/rtuser/Library/Application Support/Screeps/scripts/127_0_0_1___21025/default/*"
cp ./dist/*.js "/Users/rtuser/Library/Application Support/Screeps/scripts/127_0_0_1___21025/default"
