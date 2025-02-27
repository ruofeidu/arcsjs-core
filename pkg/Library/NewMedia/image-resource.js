/**
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
import {Xen} from '../Dom/Xen/xen-async.js';
import {Resources} from '../App/Resources.js';

const template = Xen.Template.html`
<style>
  :host {
    display: flex;
    overflow: hidden;
    font-size: 10px;
    color: black;
    /* background-color: black; */
  }
  * {
    box-sizing: border-box;
  }
  canvas {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  [flip] {
    transform: scaleX(-1);
  }
</style>

<canvas></canvas>

`;

//const oneTransparentPixel = `data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==`;

export class ImageResource extends Xen.Async {
  static get observedAttributes() {
    return ['image', 'masks'];
  }
  get template() {
    return template;
  }
  _didMount() {
    this.canvas = this._dom.$('canvas');
    this.canvasId = Resources.allocate(this.canvas);
  }
  update({image, masks}, state, {service}) {
    // manage inputs
    let useMasks = masks;
    if (!useMasks && image?.masksResource) {
      useMasks = image;
    }
    if (useMasks) {
      this.updateMasks(useMasks, state);
    } else {
      this.updateImage(image, state);
    }
  }
  async updateMasks(masks, state) {
    if (masks !== state.masks) {
      state.masks = masks;
      const realMasks = Resources.get(masks?.masksResource);
      const mask = realMasks[0];
      if (mask) {
        state.canvas = await mask.toCanvasImageSource();
      }
    }
  }
  updateImage(image, state) {
    if (!image?.canvas && image?.url) {
      image.canvas = this.canvasId;
      this.updateImageCanvas(image);
      this.value = image;
      this.fire('canvas');
    }
    if (image?.canvas && image.canvas !== this.canvasId) {
      const realCanvas = Resources.get(image.canvas);
      this.copyImage(realCanvas);
    }
  }
  copyImage(image) {
    if (image) {
      const {width, height} = image;
      if (width && height) {
        Object.assign(this.canvas, {width, height});
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
      }
    }
  }
  updateImageCanvas(image) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.url;
    (async () => {
      await img.decode();
      this.copyImage(img);
    })();
  }
  // render({image}, state) {
  //   const model = {};
  //   const canvas = state.canvas;
  //   if (canvas && canvas.width && canvas.height) {
  //     this.canvas.width = canvas.width;
  //     this.canvas.height = canvas.height;
  //     const ctx = this.canvas.getContext('2d');
  //     ctx.drawImage(canvas, 0, 0);
  //   } else {
  //     // TODO(sjmiles): seeing repeated Network hits when setting image.src = image.src,
  //     // so doing some jumping about here to avoid this (bogus) side-effect
  //     const src = image?.url || oneTransparentPixel;
  //     if (state.src !== src) {
  //       model.src = state.src = src;
  //     }
  //   }
  //   return {
  //     canvasNotImage: Boolean(canvas).toString(),
  //     ...model
  //   };
  // }
  // renderImage({image}, {canvas, src}) {
  //   const model = {};
  //   if (canvas && canvas.width && canvas.height) {
  //     this.canvas.width = canvas.width;
  //     this.canvas.height = canvas.height;
  //     const ctx = this.canvas.getContext('2d');
  //     ctx.drawImage(canvas, 0, 0);
  //   } else {
  //     // TODO(sjmiles): seeing repeated Network hits when setting image.src = image.src,
  //     // so doing some jumping about here to avoid this side-effect
  //     const src = image?.url || oneTransparentPixel;
  //     if (src !== src) {
  //       model.src = src;
  //     }
  //   }
  //   return {
  //     canvasNotImage: Boolean(canvas).toString(),
  //     ...model
  //   };
  // }
}
customElements.define('image-resource', ImageResource);
