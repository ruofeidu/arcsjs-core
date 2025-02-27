/**
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

import {Xen} from '../Xen/xen-async.js';

const template = Xen.Template.html`
<style>:host {display: block;}</style>
<mwc-top-app-bar prominent centerTitle scroll-target="{{scrollTarget:scrollTarget}}">
  <slot name="title" slot="title"></slot>
  <slot name="actionItems" slot="actionItems"></slot>
  <slot></slot>
</mwc-top-app-bar>
`;

export class MxcTopAppBar extends Xen.Async {
  static get observedAttributes() {
    return ['scroller'];
  }
  get template() {
    return template;
  }
  update({scroller}, state) {
    if (state.scroller !== scroller) {
      state.scroller = scroller;
      state.realTarget = this._dom.$(scroller) || document.body;
    }
  }
  render({}, {realTarget}) {
     return {realTarget};
  }
}