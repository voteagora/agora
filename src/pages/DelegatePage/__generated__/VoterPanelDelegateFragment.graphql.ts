/**
 * @generated SignedSource<<ef7a6a37f7d0884a74f71e93f9d3274f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type VoterPanelDelegateFragment$data = {
  readonly id: string;
  readonly nounsRepresented: ReadonlyArray<{
    readonly owner: {
      readonly id: string;
    };
  }>;
  readonly proposals: ReadonlyArray<{
    readonly id: string;
  }>;
  readonly tokenHoldersRepresented: ReadonlyArray<{
    readonly id: string;
    readonly nouns: ReadonlyArray<{
      readonly id: string;
      readonly " $fragmentSpreads": FragmentRefs<"NounImageFragment">;
    }>;
  }>;
  readonly votes: ReadonlyArray<{
    readonly id: string;
    readonly proposal: {
      readonly id: string;
    };
  }>;
  readonly " $fragmentSpreads": FragmentRefs<"NounGridFragment">;
  readonly " $fragmentType": "VoterPanelDelegateFragment";
};
export type VoterPanelDelegateFragment$key = {
  readonly " $data"?: VoterPanelDelegateFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"VoterPanelDelegateFragment">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = [
  (v0/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "VoterPanelDelegateFragment",
  "selections": [
    (v0/*: any*/),
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
        {
          "alias": null,
          "args": null,
          "concreteType": "Account",
          "kind": "LinkedField",
          "name": "owner",
          "plural": false,
          "selections": (v1/*: any*/),
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
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "Noun",
          "kind": "LinkedField",
          "name": "nouns",
          "plural": true,
          "selections": [
            (v0/*: any*/),
            {
              "args": null,
              "kind": "FragmentSpread",
              "name": "NounImageFragment"
            }
          ],
          "storageKey": null
        }
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
        {
          "kind": "Literal",
          "name": "orderDirection",
          "value": "desc"
        }
      ],
      "concreteType": "Vote",
      "kind": "LinkedField",
      "name": "votes",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "Proposal",
          "kind": "LinkedField",
          "name": "proposal",
          "plural": false,
          "selections": (v1/*: any*/),
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
      "selections": (v1/*: any*/),
      "storageKey": null
    }
  ],
  "type": "Delegate",
  "abstractKey": null
};
})();

(node as any).hash = "9acffb20499e614552f6b81e39cc0472";

export default node;
