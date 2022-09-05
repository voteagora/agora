/**
 * @generated SignedSource<<92457cf6fd5999f4be6c4fe8b8ed9d23>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PastProposalsFormSectionProposalListFragment$data = {
  readonly allProposals: ReadonlyArray<{
    readonly description: string;
    readonly id: string;
  }>;
  readonly " $fragmentType": "PastProposalsFormSectionProposalListFragment";
};
export type PastProposalsFormSectionProposalListFragment$key = {
  readonly " $data"?: PastProposalsFormSectionProposalListFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"PastProposalsFormSectionProposalListFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "PastProposalsFormSectionProposalListFragment",
  "selections": [
    {
      "alias": "allProposals",
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 1000
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
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "description",
          "storageKey": null
        }
      ],
      "storageKey": "proposals(first:1000,orderBy:\"createdBlock\",orderDirection:\"desc\")"
    }
  ],
  "type": "Query",
  "abstractKey": null
};

(node as any).hash = "3410fef607607f9009a00ca26c23cb1e";

export default node;
