/**
 * @generated SignedSource<<1e3b2a2a9bc2323bf2fb008f0b5ac176>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type DelegatePageQuery$variables = {
  address: string;
  id: string;
};
export type DelegatePageQuery$data = {
  readonly account: {
    readonly " $fragmentSpreads": FragmentRefs<"PageHeaderFragment">;
  } | null;
  readonly delegate: {
    readonly " $fragmentSpreads": FragmentRefs<"PastVotesFragment" | "VoterPanelDelegateFragment">;
  } | null;
  readonly " $fragmentSpreads": FragmentRefs<"VoterPanelQueryFragment">;
};
export type DelegatePageQuery = {
  response: DelegatePageQuery$data;
  variables: DelegatePageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "address"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v2 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v3 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "address"
  }
],
v4 = {
  "kind": "Literal",
  "name": "orderDirection",
  "value": "desc"
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = [
  (v5/*: any*/)
],
v7 = {
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
    (v5/*: any*/)
  ],
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "concreteType": "Noun",
  "kind": "LinkedField",
  "name": "nouns",
  "plural": true,
  "selections": [
    (v5/*: any*/),
    (v7/*: any*/)
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "DelegatePageQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "VoterPanelQueryFragment"
      },
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegate",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "VoterPanelDelegateFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "PastVotesFragment"
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": (v3/*: any*/),
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
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "DelegatePageQuery",
    "selections": [
      {
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
          (v4/*: any*/)
        ],
        "concreteType": "Proposal",
        "kind": "LinkedField",
        "name": "proposals",
        "plural": true,
        "selections": (v6/*: any*/),
        "storageKey": "proposals(first:10,orderBy:\"createdBlock\",orderDirection:\"desc\")"
      },
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegate",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Noun",
            "kind": "LinkedField",
            "name": "nounsRepresented",
            "plural": true,
            "selections": [
              (v5/*: any*/),
              (v7/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Account",
                "kind": "LinkedField",
                "name": "owner",
                "plural": false,
                "selections": (v6/*: any*/),
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
              (v5/*: any*/),
              (v8/*: any*/)
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
              (v4/*: any*/)
            ],
            "concreteType": "Vote",
            "kind": "LinkedField",
            "name": "votes",
            "plural": true,
            "selections": [
              (v5/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Proposal",
                "kind": "LinkedField",
                "name": "proposal",
                "plural": false,
                "selections": [
                  (v5/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "description",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "values",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
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
                "kind": "ScalarField",
                "name": "supportDetailed",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "votes",
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
            "selections": (v6/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Account",
        "kind": "LinkedField",
        "name": "account",
        "plural": false,
        "selections": [
          (v8/*: any*/),
          (v5/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "c457283168e0019a785cbaf57af86285",
    "id": null,
    "metadata": {},
    "name": "DelegatePageQuery",
    "operationKind": "query",
    "text": "query DelegatePageQuery(\n  $id: ID!\n  $address: ID!\n) {\n  ...VoterPanelQueryFragment\n  delegate(id: $id) {\n    ...VoterPanelDelegateFragment\n    ...PastVotesFragment\n    id\n  }\n  account(id: $address) {\n    ...PageHeaderFragment\n    id\n  }\n}\n\nfragment NounGridFragment on Delegate {\n  nounsRepresented {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment NounImageFragment on Noun {\n  seed {\n    accessory\n    background\n    body\n    glasses\n    head\n    id\n  }\n}\n\nfragment PageHeaderFragment on Account {\n  nouns {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment PastVotesFragment on Delegate {\n  votes(orderBy: blockNumber, orderDirection: desc) {\n    id\n    ...VoteDetailsFragment\n  }\n}\n\nfragment VoteDetailsFragment on Vote {\n  id\n  reason\n  supportDetailed\n  votes\n  proposal {\n    id\n    description\n    values\n  }\n}\n\nfragment VoterPanelDelegateFragment on Delegate {\n  id\n  ...NounGridFragment\n  nounsRepresented {\n    owner {\n      id\n    }\n    id\n  }\n  tokenHoldersRepresented {\n    id\n    nouns {\n      id\n      ...NounImageFragment\n    }\n  }\n  votes(orderBy: blockNumber, orderDirection: desc) {\n    id\n    proposal {\n      id\n    }\n  }\n  proposals {\n    id\n  }\n}\n\nfragment VoterPanelQueryFragment on Query {\n  proposals(orderBy: createdBlock, orderDirection: desc, first: 10) {\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "c1b9836b3a57789c7e0efb2e25e3e711";

export default node;
