/**
 * @generated SignedSource<<85cc650bb92e3a1baa1882e4b112bd6d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type VoteDetailsFragment$data = {
  readonly id: string;
  readonly proposal: {
    readonly description: string;
    readonly id: string;
    readonly values: ReadonlyArray<any> | null;
  };
  readonly reason: string | null;
  readonly supportDetailed: number;
  readonly votes: any;
  readonly " $fragmentType": "VoteDetailsFragment";
};
export type VoteDetailsFragment$key = {
  readonly " $data"?: VoteDetailsFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"VoteDetailsFragment">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "VoteDetailsFragment",
  "selections": [
    (v0/*: any*/),
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
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Proposal",
      "kind": "LinkedField",
      "name": "proposal",
      "plural": false,
      "selections": [
        (v0/*: any*/),
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
    }
  ],
  "type": "Vote",
  "abstractKey": null
};
})();

(node as any).hash = "53bd0018569b159296c30122d0ff1094";

export default node;
