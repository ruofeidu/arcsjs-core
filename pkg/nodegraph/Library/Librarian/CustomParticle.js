import { deepEqual } from "../../conf/allowlist";

/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */
({
initialize({}, state) {
  state.particle = {code: '', html: ''};
},
async update({particle, recipe, nodeKey}, state, tools) {
  if (nodeKey && particle && !deepEqual(particle, state.particle)) {
    await this.destroyParticle(state, tools);
    await this.addParticle(nodeKey, particle, state, tools);
    state.particle = particle;
  }
  if (nodeKey && recipe) {
    const parsedRecipe = this.parseJson(recipe);
    if (parsedRecipe && !deepEqual(parsedRecipe, state.recipe)) {
      await this.updateStores(nodeKey, parsedRecipe, state, tools);
      state.recipe = parsedRecipe;
    }
  }
},

async updateStores(nodeKey, recipe, state, {service}) {
  recipe = this.updateKeys(nodeKey, recipe);
  if (deepEqual(keys(recipe.$stores), keys(state.recipe?.$stores))) {
    keys(recipe.$stores).forEach(async storeKey => {
      await service({msg: 'setStoreData', data: {storeKey, data: recipe.$stores.$value}});
    });
  } else {
    if (state.recipe) {
      await service({msg: 'removeRecipe', data: {recipe: state.recipe}});
    }
    await service({msg: 'addRecipe', data: {recipe}});
  }
},

updateKeys(nodeKey, recipe) {
  const newRecipe = {...recipe, $stores: {}};
  keys(recipe.$stores).forEach(key => {
    newRecipe.$stores[`${nodeKey}:${key}`] = recipe.$stores[key];
  });
  return newRecipe;
},

async destroyParticle({particleName: name}, {service}) {
  if (name) {
    return service({msg: 'destroyParticle', data: {name}});
  }
},

async addParticle(nodeKey, particle, state, {service}) {
  const name = await service({msg: 'makeName'});
  const code = this.packageParticleSource(particle);
  const meta = {
    // ...this.getMeta(particle.meta),
    ...this.updateBindings(nodeKey, this.parseJson(`{${particle.meta}}`)),
    kind: name,
    container: `${nodeKey}customParticle#canvas`
  };
  
  state.particleName = name;
  return service({msg: 'addParticle', data: {name, meta, code}});
},

parseJson(str) {
  try {
    // const userMeta = JSON.parse(`{${str}}`);
    const userMeta = JSON.parse(str);
    return (typeof userMeta === 'object') ? {...userMeta} : null;
  } catch(x) {
    // warn user somehow
  }
  return null;
},

updateBindings(nodeKey, meta) {
  return {
    ...meta,
    inputs: meta.inputs?.map(input => this.updateBinding(nodeKey, input)) || [],
    outputs: meta.outputs?.map(output => this.updateBinding(nodeKey, output)) || [],
  };
},

updateBinding(nodeKey, io) {
  const {key, binding} = this.decodeBinding(io);
  return {[key]: `${nodeKey}:${binding}`};
},

decodeBinding(value) {
  if (typeof value === 'string') {
    return {key: value, binding: value};
  } else {
    const [key, binding] = entries(value)[0];
    return {key, binding};
  }
},

packageParticleSource(props) {
  if (props) {
    const {code, html} = props;
    return `({
      ${code ? `${code},` : ''}
      ${html ? `template: html\`${html}\`` : ''}
    });`;
  }
},

oChanged({eventlet: {key, value}, particle}) {
  return {particle: {...particle, [key]: value}};
},

onRecipeChanged({eventlet: {value}}) {
  return {recipe: value};
},

render({}, {particle, recipe}) {
  return {
    ...particle,
    recipe: JSON.stringify(recipe, null, 2)
  };
},

template: html`
<style>
  :host {
    font-size: 0.75em;
    flex: none !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 5px;
    border: 1px solid gray;
    /* padding: 2px; */
    margin: 4px;
    width: 320px;
    height: 240px;
    --mdc-icon-button-size: 24px;
    --mdc-icon-size: 12px;
    --mdc-tab-height: 24px;
    --mdc-typography-button-font-size: 0.875em;
    background: #eee;
  }
  mxc-tab-pages {
    background: #fff;
  }
  [toolbar] {
    color: #fafafa;
    background: #edaf22;
    padding: 0 0 2px 6px;
  }
</style>
<mxc-tab-pages flex tabs="Preview, Html, Js, Meta, Recipe">
  <div flex frame="canvas"></div>
  <code-mirror flex text="{{html}}" key="html" on-code-blur="onChanged"></code-mirror>
  <code-mirror flex text="{{code}}" key="code" on-code-blur="onChanged"></code-mirror>
  <code-mirror flex text="{{meta}}" key="meta" on-code-blur="onChanged"></code-mirror>
  <code-mirror flex text="{{recipe}}" key="recipe" on-code-blur="onRecipeChanged"></code-mirror>
</mxc-tab-pages>
`
});
