#!/bin/bash

rm -rf ./dist || true

mkdir ./dist

find ./js -name '*.js' -exec cp {} ./dist \;

grunt screeps
