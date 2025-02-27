/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */
import {Resources} from '../App/Resources.js';

export const incrementVersion = version => (Number(version) || 0) + 1;

/**
 * Get an image from store data of Image type.
 * @param data either contains a canvas that renders an image or a url.
 * @returns the canvas or an HTMLImageElement.
 */
export async function requireImage(data) {
  const imagePromise = Resources.get(data?.canvas) ?? loadImage(data?.url);
  if (imagePromise) {
    const image = await imagePromise;
    return image;
  }
  return null;
}

export const allocateCanvas = async () => {
  //const realCanvas = new OffscreenCanvas(240, 180);
  const d = document;
  const realCanvas = d.body.appendChild(Object.assign(d.createElement('canvas'), {
    style: 'display: none; width: 240px; height: 180px;'
  }));
  return Resources.allocate(realCanvas);
};

/**
 * Get an image from a url.
 * @param src url for the image.
 * @returns an HTMLImageElement.
 */
export async function loadImage(src) {
  return src && new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    setTimeout(() => resolve(img), 3000);
    img.src = src;
  });
}

