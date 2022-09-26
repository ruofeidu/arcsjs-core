/**
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
import {Chef, ParticleCook, Parser} from '../core.js';

const {assign, keys, entries, values} = Object;

export const RecipeService = async (runtime, host, request) => {
  switch (request.msg) {
    case 'FinagleRecipe':
      return finagleRecipe(runtime, host, request.data);
    case 'UpdateConnections':
      return updateConnections(host, request.data);
    case 'ParseRecipe':
      return parseRecipe(request.data);
    case 'PipelineToRecipes':
      return pipelineToRecipes(runtime, request.data);
  }
};

const parseRecipe =  ({recipe}) => {
  const parser = new Parser(recipe);
  const {stores, particles, slots, meta} = parser;
  return {stores, particles, slots, meta};
};

const finagleRecipe = async (runtime, host, {recipe, value}) => {
  const task = value ? 'execute' : 'evacipate';
  return recipe && Chef[task](recipe, runtime, host.arc);
};

const updateConnections = (host, {particleId, spec}) => {
  return host.arc.updateParticleMeta(particleId, ParticleCook.specToMeta(spec));
};

const pipelineToRecipes = async (runtime, {pipeline}) => {
  const recipier = new Recipier(runtime.stores['nodeTypes'].data);
  return pipeline.nodes
    .map(node => recipier.recipeForNode(node, pipeline))
    .filter(recipe => recipe)
  ;
};

class Recipier {
  connectorDelim = '$$';
  nameDelim = ':';
  nodeTypeMap = {};
  
  constructor(nodeTypes) {
    values(nodeTypes).forEach(t => this.nodeTypeMap[t.$meta.name] = this.flattenNodeType(t));  
  }

  flattenNodeType(nodeType, $container) {
    const flattened = {};
    keys(nodeType).forEach(key => {
      if (key.startsWith('$')) {
        flattened[key] = nodeType[key];
      } else {
        assign(flattened, this.flattenParticleSpec(key, nodeType[key], $container));
      }
    });
    return flattened;
  }

  flattenParticleSpec(particleId, particleSpec, $container) {
    const flattened = {
      [particleId]: {
        ...particleSpec,
        $slots: {},
        ...($container && {$container})
      }
    };
    entries(particleSpec.$slots || {}).forEach(([slotId, slotRecipe]) => {
      assign(flattened, this.flattenNodeType(slotRecipe, `${particleId}#${slotId}`));
    });
    return flattened;
  }

  decodeBinding(value) {
    if (typeof value === 'string') {
      return {key: value, binding: ''};
    } else {
      const [key, binding] = entries(value)[0];
      return {key, binding};
    }
  }
  
  recipeForNode(node, pipeline) { //}, customInspectors, inspectorData, globalStores) {
    const nodeType = this.nodeTypeMap[node.name];
    const recipe = this.buildParticleSpecs(nodeType, node); //, globalStores);
    recipe.$meta = {
      name: this.encodeFullNodeKey(node, pipeline, this.connectorDelim)
    };
    if (nodeType?.$stores) {
      recipe.$stores = this.buildStoreSpecs(node, nodeType, /*nodeTypeMap,*/ pipeline);
    }
    // this.addInspectorSpecs(recipe, node, nodeType, customInspectors, inspectorData);
    return recipe;
  }

  buildParticleSpecs(nodeType, node) {//}, globalStores) {
    const specs = {};
    const names = this.getParticleNames(nodeType) || [];
    for (const particleName of names) {
      specs[`${node.key}${particleName}`] =
          this.buildParticleSpec(nodeType, node, particleName, `main#runner`); //, globalStores);
    }
    return specs;
  }
  
  getParticleNames(recipe) {
    const notKeyword = name => !name.startsWith('$');
    return recipe && keys(recipe).filter(notKeyword);
  }
  
  buildParticleSpec(nodeType, node, particleName, defaultContainer) { //, globalStores) {
    const particleSpec = nodeType[particleName];
    const $container = this.resolveContainer(
      node.key,
      particleSpec.$container,
      node.position?.preview?.[`${node.key}${particleName}:Container`]/*?.container*/ || defaultContainer
    );
    const bindings = this.resolveBindings(nodeType, node, particleSpec); //, globalStores);
    const resolvedSpec = {
      $slots: {},
      ...particleSpec,
      ...bindings,
      ...($container && {$container})
    };
    return resolvedSpec;
  }
  
  resolveContainer(nodeName, containerName, defaultContainer) {
    return containerName ? `${nodeName}${containerName}` : defaultContainer;
  }
  
  resolveBindings(nodeType, node, particleSpec) { //}, globalStores) {
    const {$inputs, $outputs} = particleSpec;
    return {
      $inputs: this.resolveGroup($inputs, node, nodeType), //globalStores),
      $outputs: this.resolveGroup($outputs, node, nodeType), //globalStores),
    };
  }
  
  resolveGroup(bindings, node, {$stores}) { //, globalStores) {
    return bindings?.map(coded => {
      const {key, binding} = this.decodeBinding(coded);
      const resolutions = this.resolveBinding(binding || key, node, $stores); //, globalStores);
      return resolutions?.map((resolution, index) => ({[`${key}${index > 0 ? String(index) : ''}`]: resolution}));
    }).flat();
  }
  
  resolveBinding(binding, node, $stores) { //, globalStores) {
    const boundStore = $stores?.[binding];
    if (boundStore && !boundStore.connection) {
      return [`${node.key}${this.nameDelim}${binding}`];
    } else {
      const selectedConnections = node.connections?.[binding]?.candidates?.filter(c => c.selected);
      if (selectedConnections) {
        return selectedConnections.map(connection => this.constructStoreId(connection));
      } else {
        const globalCandidate = this.findGlobalCandidate(binding); //, globalStores);
        if (globalCandidate) {
          return [globalCandidate];
        }
      }
    }
  }
  
  buildStoreSpecs(node, nodeType, /*nodeTypeMap,*/ pipeline) {
    const specs = {};
    const stores = nodeType.$stores || {};
    entries(stores).forEach(([name, store]) => {
      if (store.connection) {
        const connections = this.getStoreConnections(name, node);
        connections.forEach(connection => {
          const spec = this.findGlobalSpec(connection, nodeType)
                    || this.findStoreSpec(connection, pipeline); //, nodeTypeMap);
          specs[this.constructStoreId(connection)] = {...spec, connection: true};
        });
      } else {
        specs[`${node.key}${this.nameDelim}${name}`] = this.buildStoreSpec(store, node.props?.[name], node);
      }
    });
    return specs;
  }
  
  getStoreConnections(storeName, node) {
    return node.connections?.[storeName]?.candidates?.filter(c => c.selected);
  }
  
  buildStoreSpec(store, value, node) {
    return {
      ...store,
      $value: this.formatStoreValue(store, value, node)
    };
  }
  
  formatStoreValue(store, value, node) {
    if (value !== undefined) {
      return value;
    }
    // TODO(mariakleiner): Revisit how to express special default values supported by NodesConnector.
    if (store.value === `node.key`) {
      return node.key;
    }
    return store.$value;
  }
  
  constructStoreId({from, store}) {
    return `${from === 'global' ? '' : `${from}${this.nameDelim}`}${store}`;
  }
  
  findGlobalSpec(connection, nodeType) {
    if (connection.from === 'global') {
      return nodeType.$stores[connection.store];
    }
  }
  
  findStoreSpec({from, store}, pipeline) { //, nodeTypeMap) {
    const nodeTypeName = pipeline.nodes.find(n => n.key === from)?.name;
    const fromNode = this.nodeTypeMap[nodeTypeName];
    return fromNode?.$stores?.[store];
  }
  
  encodeFullNodeKey({key}, {$meta}, delimiter) {
    return [$meta?.name, key].filter(Boolean).join(delimiter);
  }
  
  sanitize(key) {
    return key.replace(/[^A-Za-z0-9]/g, '');
  }
};