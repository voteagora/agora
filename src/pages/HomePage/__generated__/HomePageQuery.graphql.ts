/**
 * @generated SignedSource<<da81cfc93c260dc8529af217fdeaa0ea>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type HomePageQuery$variables = {
  address: string;
};
export type HomePageQuery$data = {
  readonly account: {
    readonly " $fragmentSpreads": FragmentRefs<"PageHeaderFragment">;
  } | null;
  readonly " $fragmentSpreads": FragmentRefs<"DelegatesContainerFragment" | "OverviewMetricsContainer">;
};
export type HomePageQuery = {
  response: HomePageQuery$data;
  variables: HomePageQuery$variables;
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
  "kind": "Literal",
  "name": "first",
  "value": 1000
},
v3 = {
  "kind": "Literal",
  "name": "orderDirection",
  "value": "desc"
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = [
  (v4/*: any*/)
],
v6 = [
  (v4/*: any*/),
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
      (v4/*: any*/)
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "HomePageQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "DelegatesContainerFragment"
      },
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "OverviewMetricsContainer"
      },
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
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "HomePageQuery",
    "selections": [
      {
        "alias": "voters",
        "args": [
          (v2/*: any*/),
          {
            "kind": "Literal",
            "name": "orderBy",
            "value": "delegatedVotes"
          },
          (v3/*: any*/),
          {
            "kind": "Literal",
            "name": "where",
            "value": {
              "delegatedVotes_gt": 0,
              "tokenHoldersRepresentedAmount_gt": 0
            }
          }
        ],
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegates",
        "plural": true,
        "selections": [
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "delegatedVotes",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "tokenHoldersRepresentedAmount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Vote",
            "kind": "LinkedField",
            "name": "votes",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Noun",
            "kind": "LinkedField",
            "name": "nounsRepresented",
            "plural": true,
            "selections": (v6/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": "delegates(first:1000,orderBy:\"delegatedVotes\",orderDirection:\"desc\",where:{\"delegatedVotes_gt\":0,\"tokenHoldersRepresentedAmount_gt\":0})"
      },
      {
        "alias": null,
        "args": [
          (v2/*: any*/),
          {
            "kind": "Literal",
            "name": "orderBy",
            "value": "tokenHoldersRepresentedAmount"
          },
          (v3/*: any*/),
          {
            "kind": "Literal",
            "name": "where",
            "value": {
              "tokenHoldersRepresentedAmount_gt": 0
            }
          }
        ],
        "concreteType": "Delegate",
        "kind": "LinkedField",
        "name": "delegates",
        "plural": true,
        "selections": (v5/*: any*/),
        "storageKey": "delegates(first:1000,orderBy:\"tokenHoldersRepresentedAmount\",orderDirection:\"desc\",where:{\"tokenHoldersRepresentedAmount_gt\":0})"
      },
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Account",
        "kind": "LinkedField",
        "name": "account",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Noun",
            "kind": "LinkedField",
            "name": "nouns",
            "plural": true,
            "selections": (v6/*: any*/),
            "storageKey": null
          },
          (v4/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "949ea62b4d244685799ca1dca8956511",
    "id": null,
    "metadata": {},
    "name": "HomePageQuery",
    "operationKind": "query",
    "text": "query HomePageQuery(\n  $address: ID!\n) {\n  ...DelegatesContainerFragment\n  ...OverviewMetricsContainer\n  account(id: $address) {\n    ...PageHeaderFragment\n    id\n  }\n}\n\nfragment DelegatesContainerFragment on Query {\n  voters: delegates(first: 1000, where: {tokenHoldersRepresentedAmount_gt: 0, delegatedVotes_gt: 0}, orderBy: delegatedVotes, orderDirection: desc) {\n    id\n    delegatedVotes\n    tokenHoldersRepresentedAmount\n    ...VoterCardFragment\n  }\n}\n\nfragment NounGridFragment on Delegate {\n  nounsRepresented {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment NounImageFragment on Noun {\n  seed {\n    accessory\n    background\n    body\n    glasses\n    head\n    id\n  }\n}\n\nfragment OverviewMetricsContainer on Query {\n  delegates(first: 1000, where: {tokenHoldersRepresentedAmount_gt: 0}, orderBy: tokenHoldersRepresentedAmount, orderDirection: desc) {\n    id\n  }\n}\n\nfragment PageHeaderFragment on Account {\n  nouns {\n    id\n    ...NounImageFragment\n  }\n}\n\nfragment VoterCardFragment on Delegate {\n  id\n  votes {\n    id\n  }\n  ...NounGridFragment\n}\n"
  }
};
})();

(node as any).hash = "1cb09a0f49efb615e042c639b6f6553c";

export default node;
