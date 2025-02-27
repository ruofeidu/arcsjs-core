/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */

const tryst = `https://arcsjs-apps.firebaseio.com/tryst`;

export const meetStrangers = async (group, nid, meta) => {
  const root = `${tryst}${group ? `/${group}` : ''}/beacons`;
  // first get all beacons
  let beacons = await fetchBeacons(root);
  // one-pass gambit: beacons are erased periodically,
  // so stale beacons do not reappear
  if (Math.random() < 0.1) {
    await clearBeacons(root);
  }
  // ensure our beacon exists at large
  nid && (await placeBeacon(root, nid, meta));
  // clean input
  if (beacons) {
    // don't need ours
    nid && (delete beacons[nid]);
  } else {
    beacons = {};
  }
  return beacons;
};

const fetchBeacons = async root => {
  return getJson(`${root}.json`);
};

const clearBeacons = async (root) => {
  return putJson(`${root}.json`, {});
};

const placeBeacon = async (root, nid, meta) => {
  await putJson(`${root}/${nid}.json`, meta);
};

const getJson = async url => {
  const res = await fetch(url);
  return res.json();
};

const putJson = async (url, body) => {
  return fetch(url, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
};
