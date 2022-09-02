/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */

import {nodeTypes, categories} from './Nodes/nodeTypes.js';
import {customInspectors} from './Inspectors/customInspectors.js';
import {NodeCatalogRecipe} from '../../Library/NodeCatalog/NodeCatalogRecipe.js';

const PipelineToolbar = {
  $kind: '$library/NodeGraph/PipelineToolbar',
  $inputs: [
    {pipeline: 'selectedPipeline'},
    'pipelines',
    'nodeTypes'
  ],
  $staticInputs: {
    publishPaths: {
    },
    // publicPipelinesUrl: '...'
  },
  $outputs: [
    {pipeline: 'selectedPipeline'},
    'pipelines',
    'nodeTypes'
  ],
  $slots: {
    chooser: {
      PipelineChooser: {
        $kind: '$library/NodeGraph/PipelineChooser',
        $inputs: [
          {pipeline: 'selectedPipeline'},
          'pipelines'
        ],
        $outputs: [{pipeline: 'selectedPipeline'}]
      }
    }
  }
};

export const NodegraphRecipe = {
  $meta: {
    description: 'Node Editor Recipe'
  },
  $stores: {
    pipelines: {
      $type: '[JSON]',
      $tags: ['persisted'],
      $value: []
    },
    selectedPipeline: {
      $type: 'JSON',
      // $tags: ['persisted'],
      $value: null
    },
    selectedNode: {
      $type: 'JSON'
    },
    allNodeTypes: {
      $type: '[JSON]',
      $value: []
    },
    nodeTypes: {
      $type: '[JSON]',
      $value: nodeTypes
    },
    inspectorData: {
      $type: 'JSON'
    },
    recipes: {
      $type: '[JSON]',
      $value: []
    },
    categories: {
      $type: 'JSON',
      $value: categories
    },
    nodeCode: {
      $type: 'JSON',
    }
  },
  main: {
    $kind: '$app/Library/Nodegraph',
    $inputs: ['pipelines', 'nodeTypes'],
    $outputs: ['allNodeTypes'],
    $slots: {
      catalog: NodeCatalogRecipe,
      toolbar: {
        PipelineToolbar
      },
      preview: {
        runner: {
          $kind: '$library/Designer/Designer',
          $inputs: [
            'recipes',
            {pipeline: 'selectedPipeline'},
            'selectedNode',
            'nodeTypes',
            'categories',
          ],
          $outputs: [
            {pipeline: 'selectedPipeline'},
            'selectedNode'
          ]
        }
      },
      editor: {
        Editor: {
          $kind: '$library/NodeGraph/Editor',
          $inputs: [
            {pipeline: 'selectedPipeline'},
            'selectedNode',
            'nodeTypes',
            'categories'
          ],
          $outputs: [
            {pipeline: 'selectedPipeline'},
            'selectedNode',
          ]
        }
      },
      inspector: {
        Inspector: {
          $kind: '$library/NodeGraph/Inspector',
          $inputs: [{data: 'inspectorData'}],
          $outputs: [{data: 'inspectorData'}],
          $staticInputs: {customInspectors}
        },
      },
      coder: {
        Coder: {
          $kind: '$app/Library/Coder.js',
          $inputs: ['selectedNode', 'nodeTypes'],
          $outputs: ['nodeCode'],
          $slots: {
            codeEditor: {
              CodeEditor: {
                $kind: '$app/../librarian/Library/Editor.js',
                $staticInputs: {name: 'helloworld'},          
                $inputs: [{'library': 'nodeCode'}],
                $outputs: [{'library': 'nodeCode'}]
              }
            }
          }
        }
      }
    }
  },
  nodeInspector: {
    $kind: '$library/NodeGraph/NodeInspector',
    $inputs: [
      {node: 'selectedNode'},
      {pipeline: 'selectedPipeline'},
      'nodeTypes',
    ],
    $outputs: [{data: 'inspectorData'}]
  },
  nodeUpdator: {
    $kind: '$library/NodeGraph/NodeUpdator',
    $inputs: [
      {node: 'selectedNode'},
      {pipeline: 'selectedPipeline'},
      {data: 'inspectorData'}
    ],
    $outputs: [
      {node: 'selectedNode'},
      {pipeline: 'selectedPipeline'},
    ]
  },
  nodesConnector: {
    $kind: '$library/NodeGraph/NodesConnector',
    $inputs: [
      {pipeline: 'selectedPipeline'},
      'selectedNode',
      'nodeTypes',
    ],
    $outputs: [
      {pipeline: 'selectedPipeline'},
      'selectedNode',
      'recipes'
    ],
    $staticInputs: {
      customInspectors,
      inspectorData: 'inspectorData',
      globalStores: [
        'selectedNode',
        'selectedPipeline'
      ]
    }
  }
};
