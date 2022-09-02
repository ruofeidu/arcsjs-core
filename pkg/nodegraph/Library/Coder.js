/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */
({
  async update({selectedNode, nodeTypes}, state, {service}) {
    const nodeType = nodeTypes.find(({$meta}) => $meta.name === selectedNode?.name);
    if (nodeType) {
      // [`CottonCandy`].$inputs
      const kind = nodeType[this.particleNames(nodeType)?.[0]]?.$kind;
      if (kind) {
        const code = await service({kind: 'RecipeService', msg: 'GetParticleCode', data: {kind}});
        return {
          nodeCode: {
            // [selectedNode.name]
            'helloworld': {
              // particle: {
              html: code, //'hello <b>world</b>',
              code: kind//'hello() {log("foo"); }'
              // }
            }
          }
        };
      }
    }
  },

  particleNames(nodeType) {
    const isKeyword = name => name.startsWith('$');
    return keys(nodeType).filter(name => !isKeyword(name));
  },
  
  template: `
<div frame="codeEditor"></div>
  `
});
