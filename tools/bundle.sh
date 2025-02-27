#!/bin/sh
# Copyright 2022 Google LLC
#
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file or at
# https://developers.google.com/open-source/licenses/bsd

cd ./pkg/core
echo ':: npx esbuild'
npx esbuild ./src/arcs.ts --bundle --sourcemap --format=esm --outfile=./arcs.js
npx esbuild ./src/arcs.ts --bundle --minify --sourcemap --target=esnext --format=esm --outfile=./arcs.min.js
npx esbuild ./src/utils.ts --bundle --minify --sourcemap --target=esnext --format=esm --outfile=./utils.min.js
echo ':: done.'
