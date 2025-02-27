/**
 * @license
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

import {Xen} from '../Dom/Xen/xen-async.js';

const log = Xen.logFactory('UserGeolocation', '#004f00');

const fallbackCoords = {latitude: 37.7610927, longitude: -122.4208173}; // San Francisco

class Geolocation extends Xen.Async {
  _getInitialState() {
    this._watchGeolocation();
  }
  _watchGeolocation() {
    const fallback = () => {
      if (!this._state?.geoCoords?.latitude) {
        this._maybeUpdateGeoCoords(fallbackCoords);
      }
    };
    if ('geolocation' in navigator) {
      const update = ({coords}) => this._maybeUpdateGeoCoords(coords);
      navigator.geolocation.watchPosition(update, fallback, {timeout: 3000, maximumAge: Infinity});
    } else {
      fallback();
    }
  }
  _maybeUpdateGeoCoords({latitude, longitude}) {
    const {geoCoords} = this._state;
    // Skip setting the position if it's the same as what we've already got.
    if (!geoCoords || geoCoords.latitude != latitude || geoCoords.longitude != longitude) {
      const coords = {latitude, longitude};
      this.value = coords;
      this._setState({geoCoords: coords});
      this._fire('coords', coords);
    }
  }
}
customElements.define('geo-location', Geolocation);
