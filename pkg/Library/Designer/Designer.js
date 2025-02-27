/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */
({
idDelimiter: '$$',

async initialize(inputs, state) {
  state.recipes = {};
  state.stores = {};
},

async update({recipes}, state, {service}) {
  recipes ??= [];
  await this.removeOldRecipes(recipes, state, service);
  await this.renewRecipes(recipes, state, service);
},

async removeOldRecipes(recipes, state, service) {
  return Promise.all(values(state.recipes).map(async recipe => {
    if (!this.findRecipe(recipe.$meta.name, recipes)) {
      return this.removeRecipe(recipe, state, service);
    }
  }));
},

async removeRecipe(recipe, state, service) {
  await this.stopRecipe(recipe, state, service);
  await this.removeStores(recipe, state, service);
},

findRecipe(recipeName, recipes) {
  return recipes.find(({$meta: {name}}) => recipeName === name);
},

async stopRecipe(recipe, state, service) {
  delete state.recipes[recipe.$meta.name];
  return service({kind: 'RecipeService', msg: 'FinagleRecipe', data: {recipe, value: false}});
},

async removeStores({$stores}, state, service) {
  return Promise.all(entries($stores || {}).map(async ([storeId, store]) => {
    if (!store.connection) {
      delete state.stores[storeId];
      await service({kind: 'StoreService', msg: 'RemoveStore', data: {storeId}});
    }
  }));
},

async renewRecipes(recipes, state, service) {
  for (const recipe of recipes) {
    const runningRecipe = state.recipes[recipe.$meta.name];
    if (!runningRecipe || runningRecipe.$meta.custom) {
      if (runningRecipe && !deepEqual(runningRecipe, recipe)) {
        await this.stopRecipe(recipe, state, service);
      }
      await this.startRecipe(recipe, state, service);
    } else {
      await this.updateConnections(recipe, runningRecipe, state, service);
      await this.updateContainers(recipe, runningRecipe, state, service);
    }
  }
},

async updateConnections(recipe, runningRecipe, state, service) {
  const particles = this.findParticlesWithChangedConnections(recipe, runningRecipe);
  particles.forEach(particleId => {
    service({kind: 'RecipeService', msg: 'UpdateConnections', data: {particleId, spec: recipe[particleId]}});
    state.recipes[recipe.$meta.name] = recipe;
  });
},

async updateContainers(recipe, runningRecipe, state, service) {
  const hostIds = this.findParticlesWithChangedContainer(recipe, runningRecipe);
  if (hostIds.length > 0) {
    const container = recipe[hostIds[0]].$container;
    await service({kind: 'ComposerService', msg: 'setContainer', data: {hostIds, container}});
    state.recipes[recipe.$meta.name] = recipe;
  }
},

omitConnectionStores(recipe, state) {
  entries(recipe.$stores || {}).forEach(([storeId, store]) => {
    if (store.connection && state.stores[storeId]) {
      delete recipe.$stores[storeId];
    } else {
      state.stores[storeId] = store;
    }
  });
  return recipe;
},

async startRecipe(recipe, state, service) {
  state.recipes[recipe.$meta.name] = recipe;
  return service({kind: 'RecipeService', msg: 'FinagleRecipe', data: {
    recipe: this.omitConnectionStores(recipe, state),
    value: true
  }});
},

findParticlesWithChangedConnections(recipe, runningRecipe) {
  const particleNames = this.getParticleNames(recipe);
  return particleNames.filter(particleName => {
    return JSON.stringify(recipe[particleName].$inputs)
      !== JSON.stringify(runningRecipe[particleName].$inputs);
  });
},

findParticlesWithChangedContainer(recipe, runningRecipe) {
  const particleNames = this.getParticleNames(recipe);
  return particleNames.filter(particleName => {
    return recipe[particleName].$container !== runningRecipe[particleName].$container;
  });
},

getParticleNames(recipe) {
  const notKeyword = name => !name.startsWith('$');
  return recipe && keys(recipe).filter(notKeyword);
},

render({pipeline, selectedNodeId, nodeTypes, categories, layout}, {recipes}) {
  const particleIdsForNode = (node) =>
      (node && !this.isUIHidden(node) &&
        this.getParticleNamesForNode(node, pipeline, recipes)) ||
      [];
  const rects = values(pipeline?.nodes).map(
    node => particleIdsForNode(node).map(id => ({id, position: layout?.[node.id]}))).flat();
  const node = pipeline?.nodes?.[selectedNodeId];
  const nodeType = nodeTypes?.[node?.type];
  return {
    selectedKeys: particleIdsForNode(node),
    rects,
    color: this.colorByCategory(nodeType?.$meta?.category, categories),
  };
},

isUIHidden(node) {
  return Boolean(node?.props?.hideUI);
},

onNodeDelete({eventlet: {key}, pipeline}, {recipes}) {
  const node = this.findNodeByParticle(key, pipeline, recipes);
  delete pipeline.nodes[node.id];
  return {pipeline, selectedNodeId: null};
},

onNodePosition({eventlet: {key, value}, pipeline, layout}, {recipes}) {
  const node = this.findNodeByParticle(key, pipeline, recipes);
  if (node) {
    return {
      selectedNodeId: node.id,
      layout: {...layout, [node.id]: value}
    };
  } else {
    return {
      selectedNodeId: null
    };
  }
},

findNodeByParticle(particleName, pipeline, recipes) {
  return values(pipeline.nodes).find(node => {
    const names = this.getParticleNamesForNode(node, pipeline, recipes);
    return names?.find(name => name === particleName);
  });
},

getParticleNamesForNode(node, pipeline, recipes) {
  if (pipeline) {
    const fullNodeId = this.encodeFullNodeId(node, pipeline);
    return this.getParticleNames(recipes[fullNodeId]);
  }
},

encodeFullNodeId({id}, {$meta}) {
  return [$meta?.id, id].filter(Boolean).join(this.idDelimiter);
},

colorByCategory(category, categories) {
  return categories?.[category]?.color || 'lightblue';
},

onDrop({eventlet: {value: typeName}, nodeTypes, pipeline}) {
  if (pipeline) {
    const nodeType = nodeTypes[typeName];
    if (nodeType) {
      const index = this.countNodesOfType(pipeline.nodes, typeName) + 1;
      const id = this.formatNodeId(typeName, index);
      pipeline.nodes[id] = this.formatNode(id, index, nodeType.$meta);
      return {
        pipeline,
        selectedNodeId: id
      };
    }
  }
},

formatNode(id, index, {id: type, displayName}) {
  return {
    id, index, type,
    displayName: this.formatDisplayName(displayName || type, index)
  };
},

countNodesOfType(nodes, type) {
  return values(nodes).filter(node => node.type === type).length;
},

formatDisplayName(name, index) {
  const capitalize = name => name.charAt(0).toUpperCase() + name.slice(1);
  return `${capitalize(name)}${index > 1 ? ` ${index}` : ''}`;
},

formatNodeId(id, index) {
  return `${id}${index}`.replace(/ /g,'');
},

template: html`
<style>
  :host {
    color: var(--theme-color-fg-1);
    background-color: var(--theme-color-bg-1);
    min-height: 120px;
  }
  designer-layout {
    height: auto !important;
  }
</style>
<div bar frame="chooser"></div>
<drop-target flex row on-target-drop="onDrop">
  <designer-layout flex scrolling column frame="runner"
                    on-position="onNodePosition"
                    on-delete="onNodeDelete"
                    selected="{{selectedKeys}}"
                    rects="{{rects}}"
                    color="{{color}}"
                    hidebox="{{hideBox}}">
  </designer-layout>
</drop-target>
`
});
