/**
 * @generated SignedSource<<a88339eaff4b5d9e82466295ad8a67cb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type NounImageFragment$data = {
  readonly seed: {
    readonly accessory: any;
    readonly background: any;
    readonly body: any;
    readonly glasses: any;
    readonly head: any;
  } | null;
  readonly " $fragmentType": "NounImageFragment";
};
export type NounImageFragment$key = {
  readonly " $data"?: NounImageFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"NounImageFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "NounImageFragment",
  "selections": [
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Noun",
  "abstractKey": null
};

(node as any).hash = "9a642eacdecb6e7fad2f9de9c1322f62";

export default node;
