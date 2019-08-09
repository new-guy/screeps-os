#!/bin/bash

rm -rf ./dist || true

mkdir ./dist

find ./js -name '*.js' -exec cp {} ./dist \;

rm -rf /home/david/.config/Screeps/scripts/127_0_0_1___21025/default/*
cp ./dist/*.js /home/david/.config/Screeps/scripts/127_0_0_1___21025/default
