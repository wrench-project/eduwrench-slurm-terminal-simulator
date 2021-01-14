#!/bin/bash
mkdir -p libs;
cp node_modules/xterm/lib/* libs/;
cp node_modules/xterm/css/* libs/;
cp node_modules/xterm-addon-fit/lib/* libs/
cp node_modules/bootstrap/dist/css/bootstrap.min.css* libs/;
./node_modules/.bin/rollup index.js -f iife -o bundle.js -p @rollup/plugin-commonjs