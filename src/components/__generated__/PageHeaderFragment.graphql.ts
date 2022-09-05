/**
 * @generated SignedSource<<52a93e5d329f1a5e7b50ea7384f855fe>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PageHeaderFragment$data = {
  readonly nouns: ReadonlyArray<{
    readonly id: string;
    readonly " $fragmentSpreads": FragmentRefs<"NounImageFragment">;
  }>;
  readonly " $fragmentType": "PageHeaderFragment";
};
export type PageHeaderFragment$key = {
  readonly " $data"?: PageHeaderFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"PageHeaderFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "PageHeaderFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Noun",
      "kind": "LinkedField",
      "name": "nouns",
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
          "name": "NounImageFragment"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Account",
  "abstractKey": null
};

(node as any).hash = "d4b0fa6ef289cb67e7824b819257e4c0";

export default node;
