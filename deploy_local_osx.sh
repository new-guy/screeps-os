#!/bin/bash

rm -rf ./dist || true

mkdir ./dist

find ./js -name '*.js' -exec cp {} ./dist \;

rm -rf "/Users/davidkirk/Library/Application Support/Screeps/scripts/192_168_0_131___21025/default
/*"
rsync -a --force --delete dist/ "/Users/davidkirk/Library/Application Support/Screeps/scripts/192_168_0_131___21025/default/"