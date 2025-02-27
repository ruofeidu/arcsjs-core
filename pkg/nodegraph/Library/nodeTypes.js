/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */

// arcs library
import * as customNodes from '../Library/Librarian/CustomNodes.js';
import * as newMediaNodes from '../../Library/NewMedia/Nodes/Nodes.js';
import * as mobilenetNodes from '../../Library/Mobilenet/MobilenetNodes.js';
import * as displayNodes from '../../Library/Display/DisplayNodes.js';
import * as shaderNodes from '../../Library/Shader/ShaderNodes.js';
import {ThreejsEditorNode} from '../../Library/Threejs/ThreejsEditorNode.js';
import {JSONataNode} from '../../Library/JSONata/JSONataNode.js';
import * as mediapipeNodes from '../../Library/Mediapipe/MediapipeNodes.js';
import {CocoSsdNode} from '../../Library/TensorFlow/CocoSsdNode.js';
import {GoogleMapNode} from '../../Library/Goog/GoogleMapNode.js';
import {MacroRunnerNode} from '../../Library/Goog/MacroRunnerNode.js';
import * as baseFieldNodes from '../../Library/Fields/FieldNodes.js';
import * as nodeGraphNodes from '../../Library/NodeGraph/NodeGraphNodes.js';
import * as testNodes from './TestNodes.js';
import * as ContainerNodes from './ContainerNodes.js';
// backburner
//import {PoemNode} from './PoemNode.js';
//import {isPoisonousNode} from './isPoisonousNode.js';
//import * as candyNodes from './Nodes/CandyNodes.js';
// import {SceneNode} from '../../Library/AFrame/SceneNode.js';

const fieldNodes = Object.values(baseFieldNodes).map(node => {
  const newNode = {...node};
  Object.keys(newNode).forEach(key => {
    if (newNode[key].$kind) {
      newNode[key].$kind = newNode[key].$kind.replace('$app', '$app/../nodebase/');
    }
  });
  return newNode;
});

const {values} = Object;

export const nodeTypes = {};

const nodeTypesList = [
  ...values(newMediaNodes),
  ...values(mediapipeNodes),
  CocoSsdNode,
  ...values(nodeGraphNodes),
  ...fieldNodes,
  ...values(ContainerNodes),
  GoogleMapNode,
  MacroRunnerNode,
  ...values(testNodes),
  //...values(candyNodes),
  ...values(mobilenetNodes),
  ...values(displayNodes),
  ...values(shaderNodes),
  //SceneNode,
  ThreejsEditorNode,
  ...values(customNodes),
  // ...values(locationNodes),
  // ...values(homescreen),
  // ...values(speech),
  // ...values(translator)
  JSONataNode
];

nodeTypesList.forEach(nodeType => {
  let {category, name} = nodeType.$meta;
  let id =  nodeType.$meta.id;
  if (id) {
    if (nodeTypes[id]) {
      console.warn(`Skipping non unique NodeType id='${id}'`);
    }
    nodeTypes[id] = nodeType;
  } else {
    console.warn(`Missing 'key' for NodeType '${name}' (category='${category}')`);
  }
});

const icons = ['coffee', 'shower', 'chair', 'flatware', 'light', 'casino', 'escalator', 'umbrella', 'theater_comedy', 'diamond'];
const colors = ['#540d6e', '#ee4266', '#ffd23f', '#3bceac', '#0ead69', '#335c67', '#aaa390', '#e09f3e', '#9e2a2b', '#540b0e'];
export const categories = {};
[...new Set(nodeTypesList.map(n => n.$meta.category))].forEach((category, i) => {
  categories[category] = {
    icon: icons[i % (icons.length - 1)],
    color: `${colors[i % (colors.length - 1)]}ff`,
    bgColor: `${colors[i % (colors.length - 1)]}33`,
  };
});
