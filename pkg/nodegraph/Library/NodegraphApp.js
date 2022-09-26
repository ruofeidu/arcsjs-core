/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */
import {App} from '../../Library/App/Worker/App.js';
import {LocalStoragePersistor} from '../../Library/LocalStorage/LocalStoragePersistor.js';
import {HistoryService} from '../../Library/App/HistoryService.js';
import {MediaService} from '../../Library/NewMedia/MediaService.js';
import {GoogleApisService} from '../../Library/Goog/GoogleApisService.js';
import {MediapipeService} from '../../Library/Mediapipe/MediapipeService.js';
import {ThreejsService} from '../../Library/Threejs/ThreejsService.js';
import {TensorFlowService} from '../../Library/TensorFlow/TensorFlowService.js';
import {ShaderService} from '../../Library/Shader/ShaderService.js';
import {NodegraphRecipe} from './NodegraphRecipe.js';
import {logFactory} from '../../Library/Core/utils.min.js';
import {NodesConnector} from './Librarian/NodesConnector.js';

const log = logFactory(true, 'Nodegraph', 'navy');

// App class
export const NodegraphApp = class extends App {
  constructor(paths) {
    super(paths);
    this.persistor = new LocalStoragePersistor('user');
    this.services = {HistoryService, MediaService, GoogleApisService, ThreejsService, ShaderService, MediapipeService, TensorFlowService};
    this.userAssembly = [NodegraphRecipe];
    log('Welcome!');
  }
  async spinup() {
    await super.spinup();
    const nodeTypes = await this.arcs.get('user', 'nodeTypes');
    const globalStores = await this.arcs.get('user', 'globalStores');
    this.nodesConnector = new NodesConnector({nodeTypes, globalStores});
    return;
  }
  // application service
  async onservice(runtime, host, {msg, data}) {
    switch (msg) {
      case 'addRecipe':
        return this.addRecipe(runtime, host, data);
      case 'removeRecipe':
        return this.removeRecipe(runtime, host, data);
      case 'addStore':
        return this.addStore(runtime, host, data);
      case 'addParticle':
        return this.addParticle(runtime, host, data);
      case 'destroyParticle':
        return this.destroyParticle(runtime, host, data);
      case 'updateNodes': {
        await this.spinupPromise;
        return this.nodesConnector.updateNodes(data);
      }
    }
  }
  async addRecipe(runtime, host, {recipe}) {
    this.arcs.addRecipe(recipe, 'user');
    return true;
  }
  async removeRecipe(runtime, host, {recipe}) {
    this.arcs.removeRecipe(recipe, 'user');
    return true;
  }
  async addParticle(runtime, host, {name, meta, code}) {
    this.arcs.createParticle(name, 'user', meta, code);
    return true;
  }
  async destroyParticle(runtime, host, {name}) {
    this.arcs.destroyParticle(name, 'user');
    return true;
  }
};
