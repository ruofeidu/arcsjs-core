/**
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

 import {Xen} from '../../Dom/Xen/xen-async.js';
 import {Resources} from '../../App/Resources.js';
 import {logFactory} from '../../Core/utils.js';
 import {subscribeToStream, unsubscribeFromStream} from './media-stream.js';

 const log = logFactory(logFactory.flags.media, 'stream-view', 'green');

 export class StreamView extends Xen.Async {
   static get observedAttributes() {
     return ['flip', 'stream', 'frequency', 'version'];
   }
   _wouldChangeProp(name, value) {
     return name === 'stream' || super._wouldChangeProp(name, value);
   }
   _didMount() {
     this.canvas = Object.assign(this._dom.$('canvas'), {width: 640, height: 480});
     this.video = this._dom.$('video');
   }
   getInitialState() {
     return {
       subscriber: this.invalidate.bind(this),
       id: Math.floor(Math.random()*1e3 + 9e2)
     };
   }
   update({frequency, stream}, state) {
     // make output canvas available as a resource id
     Resources.set(state.id, this.canvas);
     this.value = state.id;
     // 'stream' here is a stream resource id
     if (stream !== state.stream) {
       unsubscribeFromStream(state.stream, state.subscriber);
       subscribeToStream(stream, state.subscriber);
       state.stream = stream;
       //console.warn(stream);
     }
     if (stream) {
       const realStream = Resources.get(stream);
       if (state.realStream !== realStream) {
         state.realStream = realStream;
         this.video.srcObject = realStream;
       }
       if (realStream?.active && frequency) {
         this.doCanvasCadence(Number(frequency), stream);
       }
     }
   }
   doCanvasCadence(frequency, id) {
     if (!this.cadencing) {
       this.cadencing = true;
       const {videoWidth: w, videoHeight: h} = this.video;
       const {width: cw, height: ch} = this.canvas;
       if (w && h) {
         //console.warn(id, 'cadence: ', w, h, cw, ch);
         if (cw !== w || ch !== h) {
           log(id, 'size: ', w, h, cw, ch);
           Object.assign(this.canvas, {width: w, height: h});
         }
         this.canvas.getContext('2d').drawImage(this.video, 0, 0, w, h);
         this.fire('canvas', id);
       }
       const msPerFrame = Math.max(1000 * (1 / frequency) ?? 0, 33);
       setTimeout(() => {
         this.cadencing = false;
         this.invalidate();
       }, msPerFrame);
       //console.warn(id, 'cadence: ', msPerFrame);
     }
   }
   render({flip, frequency}, {}) {
     return {
       flip,
       canvasNotVideo: Boolean(frequency).toString()
     };
   }
   onVideoReady() {
     this.mergeState({videoReady: true});
     this.video.play();
   }
   onVideoPlaying() {
     this.mergeState({videoPlaying: true});
   }
   hasVideoTracks(stream) {
     return stream.getVideoTracks().some(track=>track.readyState !== 'ended');
   }
   get template() {
     return Xen.Template.html`
 <style>
   :host {
     display: flex;
     /* min-width: 160px;
     min-height: 120px; */
     font-size: 10px;
     color: black;
     background-color: black;
     position: relative;
   }
   * {
     box-sizing: border-box;
   }
   /* canvas overlays video */
   video {
     position: absolute;
   }
   canvas, video {
     object-fit: contain;
     width: 100%;
     height: 100%;
   }
   [flip] {
     transform: scaleX(-1);
   }
   [hide=true],[show=false] {
     visibility: hidden;
   }
 </style>

 <video hide$="{{canvasNotVideo}}" autoplay playsinline muted flip$="{{flip}}"></video>
 <canvas show$="{{canvasNotVideo}}"></canvas>

    `;
   }
 }
 customElements.define('stream-view', StreamView);
