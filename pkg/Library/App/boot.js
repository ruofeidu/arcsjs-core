/**
 * @license
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
export const quickStart = (App, url, extraPaths) => {
  document.body.style.opacity = 0;
  configurePaths(Paths, url, extraPaths);
  boot(App, Paths);
  setTimeout(() => Object.assign(document.body.style,
    {opacity: 1, transition: 'opacity 300ms ease-out'}), 100);
};

export const configurePaths = (Paths, metaUrl, extraPaths) => {
  // remove parameters from import-meta url
  const url = metaUrl.split('?').shift();
  console.warn(url);
  // get the absolute path of `url`, minus the filename (remove `1`)
  // TODO(sjmiles): the default is good, but when you have to adjust
  // it can be a hassle to get the url right from the calling side.
  const app = Paths.getAbsoluteHereUrl({url}, 1);
  Paths.add({
    $app: app,
    $config: `${app}/config.js`,
    $library: `${app}/${globalThis.config.arcsPath}`
  });
  Object.keys(extraPaths).forEach(key => {
    Paths.map[key] = Paths.resolve(extraPaths[key]);
  });
};

export const boot = async (App, Paths) => {
  try {
    app = globalThis.app = new App(Paths.map);
    await app.spinup();
  } catch(x) {
    console.error(x);
  }
};
