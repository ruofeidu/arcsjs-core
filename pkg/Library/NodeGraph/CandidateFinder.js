/**
 * @license
 * Copyright (c) 2022 Google LLC All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
({

async update({pipeline, nodeTypes, globalStores}, state) {
  if (pipeline && this.pipelineChanged(pipeline, state.pipeline)) {
    state.pipeline = pipeline;
    return {
      candidates: this.findCandidates(pipeline, nodeTypes, globalStores)
    };
  }
},

pipelineChanged(pipeline, oldPipeline) {
  return pipeline.id !== oldPipeline?.id || 
         keys(pipeline.nodes).length !== keys(oldPipeline?.nodes).length;
},

findCandidates(pipeline, nodeTypes, globalStores) {
  const candidates = {};
  values(pipeline?.nodes).forEach(node => {
    candidates[node.id] = this.findNodeCandidates(node, pipeline, nodeTypes, globalStores);
  });
  return candidates;
},

findNodeCandidates(node, pipeline, nodeTypes, globalStores) {
  const candidates = {};
  entries(nodeTypes[node.type]?.$stores).forEach(([storeName, store]) => {
    if (store.connection) {
      candidates[storeName] =
        this.findConnectionCandidates(node.id, storeName, store, pipeline, nodeTypes, globalStores);
    }
  });
  return candidates;
},
findConnectionCandidates(nodeId, storeName, {$type}, {nodes}, nodeTypes, globalStores) {
  const candidates = [];
  candidates.push(this.findGlobalCandidate(storeName, $type, globalStores));
  values(nodes).forEach(node => {
    if (node.id !== nodeId) {
      candidates.push(...this.findCandidatesInNode(node.id, $type, nodeTypes[node.type]));
    }
  });
  return candidates.filter(c => c);
},

findGlobalCandidate(storeName, type, globalStores) {
  if (globalStores?.find(name => name === storeName)) {
    return {storeName, type};
  }
},

findCandidatesInNode(from, type, nodeType) {
  const matchingType = (storeType) => {
    // TODO(b/244191110): Type matching API to be wired here.
    return storeType === type;
  };
  const candidates = [];
  const isCandidate = (storeName, {$type, connection}) => matchingType($type) && !connection && this.storeHasOutput(storeName, nodeType);
  for (const [storeName, store] of entries(nodeType?.$stores)) {
    if (isCandidate(storeName, store)) {
      candidates.push({from, storeName, type: store.$type});
    }
  }
  return candidates;
},

storeHasOutput(storeName, nodeType) {
  return this.getParticleNames(nodeType).some(
      name => this.hasMatchingStore(nodeType[name].$outputs, storeName));
},

getParticleNames(nodeType) {
  const notKeyword = name => !name.startsWith('$');
  return keys(nodeType).filter(notKeyword);
},

hasMatchingStore(bindings, storeName) {
  return bindings?.some(binding => this.isMatchingStore(storeName, binding));
},

isMatchingStore(storeName, connection) {
  const {key, binding} = this.decodeBinding(connection);
  return (binding || key) == storeName;
},

decodeBinding(value) {
  if (typeof value === 'string') {
    return {key: value, binding: ''};
  } else {
    const [key, binding] = entries(value)[0];
    return {key, binding};
  }
}

});
