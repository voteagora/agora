/**
 * @generated SignedSource<<3dddd0eed9a81aa87f2f73bc30836a35>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type DelegatesContainerFragment$data = {
  readonly voters: ReadonlyArray<{
    readonly delegatedVotes: any;
    readonly id: string;
    readonly tokenHoldersRepresentedAmount: number;
    readonly " $fragmentSpreads": FragmentRefs<"VoterCardFragment">;
  }>;
  readonly " $fragmentType": "DelegatesContainerFragment";
};
export type DelegatesContainerFragment$key = {
  readonly " $data"?: DelegatesContainerFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"DelegatesContainerFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DelegatesContainerFragment",
  "selections": [
    {
      "alias": "voters",
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 1000
        },
        {
          "kind": "Literal",
          "name": "orderBy",
          "value": "delegatedVotes"
        },
        {
          "kind": "Literal",
          "name": "orderDirection",
          "value": "desc"
        },
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
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        },
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
          "args": null,
          "kind": "FragmentSpread",
          "name": "VoterCardFragment"
        }
      ],
      "storageKey": "delegates(first:1000,orderBy:\"delegatedVotes\",orderDirection:\"desc\",where:{\"delegatedVotes_gt\":0,\"tokenHoldersRepresentedAmount_gt\":0})"
    }
  ],
  "type": "Query",
  "abstractKey": null
};

(node as any).hash = "46cfc653196abf0cbe4856ae4602a497";

export default node;
