/**
 * @generated SignedSource<<f0a8a077592e02e2c27c7d67a93814d7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type DelegatePageQuery$variables = {
  id: string;
};
export type DelegatePageQuery$data = {
  readonly delegate: {
    readonly id: string;
    readonly nounsRepresented: ReadonlyArray<{
      readonly owner: {
        readonly id: string;
      };
    }>;
    readonly votes: ReadonlyArray<{
      readonly id: string;
      readonly proposal: {
        readonly description: string;
        readonly id: string;
      };
      readonly reason: string | null;
    }>;
    readonly " $fragmentSpreads": FragmentRefs<"NounGridFragment">;
  } | null;
  readonly proposals: ReadonlyArray<{
    readonly id: string;
  }>;
};
export type DelegatePageQuery = {
  response: DelegatePageQuery$data;
  variables: DelegatePageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  (v2/*: any*/)
],
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "Account",
  "kind": "LinkedField",
  "name": "owner",
  "plural": false,
  "selections": (v3/*: any*/),
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "concreteType": "Vote",
  "kind": "LinkedField",
  "name": "votes",
  "plural": true,
  "selections": [
    (v2/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "reason",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Proposal",
      "kind": "LinkedField",
      "name": "proposal",
      "plural": false,
      "selections": [
        (v2/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "description",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 10
    },
    {
      "kind": "Literal",
      "name": "orderBy",
      "value": "createdBlock"
    },
    {
      "kind": "Literal",
      "name": "orderDirection",
      "value": "desc"
    }
  ],
  "concreteType": "Proposal",
  "kind": "LinkedField",
  "name": "proposals",
  "plural": true,
  "selections": (v3/*: any*/),
  "storageKey": "proposals(first:10,orderBy:\"createdBlock\",orderDirection:\"desc\")"
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "DelegatePageQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegate",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "NounGridFragment"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Noun",
            "kind": "LinkedField",
            "name": "nounsRepresented",
            "plural": true,
            "selections": [
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          (v5/*: any*/)
        ],
        "storageKey": null
      },
      (v6/*: any*/)
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DelegatePageQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegate",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Noun",
            "kind": "LinkedField",
            "name": "nounsRepresented",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Seed",
                "kind": "LinkedField",
                "name": "seed",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "accessory",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "background",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "body",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "glasses",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "head",
                    "storageKey": null
                  },
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          (v5/*: any*/)
        ],
        "storageKey": null
      },
      (v6/*: any*/)
    ]
  },
  "params": {
    "cacheID": "7013defcff0267d5e478e3dbc19ba5d5",
    "id": null,
    "metadata": {},
    "name": "DelegatePageQuery",
    "operationKind": "query",
    "text": "query DelegatePageQuery(\n  $id: ID!\n) {\n  delegate(id: $id) {\n    id\n    ...NounGridFragment\n    nounsRepresented {\n      owner {\n        id\n      }\n      id\n    }\n    votes {\n      id\n      reason\n      proposal {\n        id\n        description\n      }\n    }\n  }\n  proposals(orderBy: createdBlock, orderDirection: desc, first: 10) {\n    id\n  }\n}\n\nfragment NounGridFragment on Delegate {\n  nounsRepresented {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment NounImageFragment on Noun {\n  seed {\n    accessory\n    background\n    body\n    glasses\n    head\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "e004144d6337849c78d1f9f36366e029";

export default node;
