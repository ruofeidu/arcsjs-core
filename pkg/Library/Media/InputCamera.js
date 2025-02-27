/**
 * @license
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
({
render({frequency, stream}, {}) {
  return {
    frequency,
    stream,
    videoNotImage: Boolean(stream).toString()
  };
},
onCanvas({eventlet: {value: ref}}) {
  return {
    image: {
      canvas: ref,
      version: Math.random()
    }
  };
},
template: html`
<style>
  :host {
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    background-color: black;
    color: #eee;
    overflow: hidden;
  }
  [rows] {
    position: relative;
  }
  video-view, image-resource {
    object-fit: contain;
  }
  /* [toolbar] {
    position: absolute;
    top: 0;
    left: 0;
    background: transparent;
    border: 1px solid black;
  } */
</style>

<div flex rows>
  <!-- <div toolbar>
    <icon>videocam</icon>
  </div> -->
  <stream-view flex show$="{{videoNotImage}}" stream="{{stream}}" frequency="{{frequency}}" on-canvas="onCanvas"></stream-view>
  <image-resource center flex hide$="{{videoNotImage}}" image="{{image}}"></image-resource>
</div>

`
});
