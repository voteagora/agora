/**
 * @generated SignedSource<<3a06d302dccd62acdf307c4b5a1b3665>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OverviewMetricsContainer$data = {
  readonly delegates: ReadonlyArray<{
    readonly id: string;
  }>;
  readonly " $fragmentType": "OverviewMetricsContainer";
};
export type OverviewMetricsContainer$key = {
  readonly " $data"?: OverviewMetricsContainer$data;
  readonly " $fragmentSpreads": FragmentRefs<"OverviewMetricsContainer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "OverviewMetricsContainer",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 1000
        },
        {
          "kind": "Literal",
          "name": "orderBy",
          "value": "tokenHoldersRepresentedAmount"
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
        }
      ],
      "storageKey": "delegates(first:1000,orderBy:\"tokenHoldersRepresentedAmount\",orderDirection:\"desc\",where:{\"tokenHoldersRepresentedAmount_gt\":0})"
    }
  ],
  "type": "Query",
  "abstractKey": null
};

(node as any).hash = "2865249f272287b08417b9b7f4c1d718";

export default node;
