/**
 * @generated SignedSource<<fbe3f59e1a404c20ca1aba6475d597b9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type VoterPanelQueryFragment$data = {
  readonly proposals: ReadonlyArray<{
    readonly id: string;
  }>;
  readonly " $fragmentType": "VoterPanelQueryFragment";
};
export type VoterPanelQueryFragment$key = {
  readonly " $data"?: VoterPanelQueryFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"VoterPanelQueryFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "VoterPanelQueryFragment",
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
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        }
      ],
      "storageKey": "proposals(first:10,orderBy:\"createdBlock\",orderDirection:\"desc\")"
    }
  ],
  "type": "Query",
  "abstractKey": null
};

(node as any).hash = "12cacfb5533db38be75140bbc36b347b";

export default node;
