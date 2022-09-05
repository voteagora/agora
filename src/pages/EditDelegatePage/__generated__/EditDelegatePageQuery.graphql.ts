/**
 * @generated SignedSource<<1252a43dbfe4786f7cdd998c0b0c95f2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type EditDelegatePageQuery$variables = {
  address: string;
};
export type EditDelegatePageQuery$data = {
  readonly account: {
    readonly " $fragmentSpreads": FragmentRefs<"PageHeaderFragment">;
  } | null;
  readonly delegate: {
    readonly " $fragmentSpreads": FragmentRefs<"VoterPanelDelegateFragment">;
  } | null;
  readonly " $fragmentSpreads": FragmentRefs<"PastProposalsFormSectionProposalListFragment" | "VoterPanelQueryFragment">;
};
export type EditDelegatePageQuery = {
  response: EditDelegatePageQuery$data;
  variables: EditDelegatePageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "address"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "address"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
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
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "Noun",
  "kind": "LinkedField",
  "name": "nouns",
  "plural": true,
  "selections": [
    (v2/*: any*/),
    (v3/*: any*/)
  ],
  "storageKey": null
},
v5 = [
  (v2/*: any*/)
],
v6 = {
  "kind": "Literal",
  "name": "orderDirection",
  "value": "desc"
},
v7 = {
  "kind": "Literal",
  "name": "orderBy",
  "value": "createdBlock"
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "EditDelegatePageQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Account",
        "kind": "LinkedField",
        "name": "account",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "PageHeaderFragment"
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegate",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "VoterPanelDelegateFragment"
          }
        ],
        "storageKey": null
      },
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "PastProposalsFormSectionProposalListFragment"
      },
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "VoterPanelQueryFragment"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "EditDelegatePageQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Account",
        "kind": "LinkedField",
        "name": "account",
        "plural": false,
        "selections": [
          (v4/*: any*/),
          (v2/*: any*/)
        ],
        "storageKey": null
      },
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
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Account",
                "kind": "LinkedField",
                "name": "owner",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Account",
            "kind": "LinkedField",
            "name": "tokenHoldersRepresented",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": [
              {
                "kind": "Literal",
                "name": "orderBy",
                "value": "blockNumber"
              },
              (v6/*: any*/)
            ],
            "concreteType": "Vote",
            "kind": "LinkedField",
            "name": "votes",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Proposal",
                "kind": "LinkedField",
                "name": "proposal",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": "votes(orderBy:\"blockNumber\",orderDirection:\"desc\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Proposal",
            "kind": "LinkedField",
            "name": "proposals",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": "allProposals",
        "args": [
          {
            "kind": "Literal",
            "name": "first",
            "value": 1000
          },
          (v7/*: any*/),
          (v6/*: any*/)
        ],
        "concreteType": "Proposal",
        "kind": "LinkedField",
        "name": "proposals",
        "plural": true,
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
        "storageKey": "proposals(first:1000,orderBy:\"createdBlock\",orderDirection:\"desc\")"
      },
      {
        "alias": null,
        "args": [
          {
            "kind": "Literal",
            "name": "first",
            "value": 10
          },
          (v7/*: any*/),
          (v6/*: any*/)
        ],
        "concreteType": "Proposal",
        "kind": "LinkedField",
        "name": "proposals",
        "plural": true,
        "selections": (v5/*: any*/),
        "storageKey": "proposals(first:10,orderBy:\"createdBlock\",orderDirection:\"desc\")"
      }
    ]
  },
  "params": {
    "cacheID": "98a9d1a1566fa2d79aa7dc8befe53393",
    "id": null,
    "metadata": {},
    "name": "EditDelegatePageQuery",
    "operationKind": "query",
    "text": "query EditDelegatePageQuery(\n  $address: ID!\n) {\n  account(id: $address) {\n    ...PageHeaderFragment\n    id\n  }\n  delegate(id: $address) {\n    ...VoterPanelDelegateFragment\n    id\n  }\n  ...PastProposalsFormSectionProposalListFragment\n  ...VoterPanelQueryFragment\n}\n\nfragment NounGridFragment on Delegate {\n  nounsRepresented {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment NounImageFragment on Noun {\n  seed {\n    accessory\n    background\n    body\n    glasses\n    head\n    id\n  }\n}\n\nfragment PageHeaderFragment on Account {\n  nouns {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment PastProposalsFormSectionProposalListFragment on Query {\n  allProposals: proposals(first: 1000, orderDirection: desc, orderBy: createdBlock) {\n    id\n    description\n  }\n}\n\nfragment VoterPanelDelegateFragment on Delegate {\n  id\n  ...NounGridFragment\n  nounsRepresented {\n    owner {\n      id\n    }\n    id\n  }\n  tokenHoldersRepresented {\n    id\n    nouns {\n      id\n      ...NounImageFragment\n    }\n  }\n  votes(orderBy: blockNumber, orderDirection: desc) {\n    id\n    proposal {\n      id\n    }\n  }\n  proposals {\n    id\n  }\n}\n\nfragment VoterPanelQueryFragment on Query {\n  proposals(orderBy: createdBlock, orderDirection: desc, first: 10) {\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "9cd64b47730a6a86349dde77a72becea";

export default node;
