#!/bin/bash

rm -rf ./dist || true

mkdir ./dist

find ./js -name '*.js' -exec cp {} ./dist \;

rm -rf ~/Library/ApplicationSupport/screeps/scripts/127_0_0_1___21025/default/*
rsync -a --delete dist/ ~/Library/ApplicationSupport/screeps/scripts/127_0_0_1___21025/default/
