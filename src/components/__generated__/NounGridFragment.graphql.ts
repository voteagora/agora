/**
 * @generated SignedSource<<14b6e5d5ec744fcddd44ad30873edc5b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type NounGridFragment$data = {
  readonly nounsRepresented: ReadonlyArray<{
    readonly id: string;
    readonly " $fragmentSpreads": FragmentRefs<"NounImageFragment">;
  }>;
  readonly " $fragmentType": "NounGridFragment";
};
export type NounGridFragment$key = {
  readonly " $data"?: NounGridFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"NounGridFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "NounGridFragment",
  "selections": [
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
  "type": "Delegate",
  "abstractKey": null
};

(node as any).hash = "7f0fafedd8ceb0cfdee863f6085e9445";

export default node;
