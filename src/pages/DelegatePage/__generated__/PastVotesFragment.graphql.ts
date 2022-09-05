/**
 * @generated SignedSource<<6117a33423e1cae3c8672effa9c8f05e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PastVotesFragment$data = {
  readonly votes: ReadonlyArray<{
    readonly id: string;
    readonly " $fragmentSpreads": FragmentRefs<"VoteDetailsFragment">;
  }>;
  readonly " $fragmentType": "PastVotesFragment";
};
export type PastVotesFragment$key = {
  readonly " $data"?: PastVotesFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"PastVotesFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "PastVotesFragment",
  "selections": [
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
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "VoteDetailsFragment"
        }
      ],
      "storageKey": "votes(orderBy:\"blockNumber\",orderDirection:\"desc\")"
    }
  ],
  "type": "Delegate",
  "abstractKey": null
};

(node as any).hash = "13608a588e357a774888fe8451aec596";

export default node;
