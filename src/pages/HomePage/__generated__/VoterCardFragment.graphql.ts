/**
 * @generated SignedSource<<6b81c629337f4a0acb169d413cd88bf3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type VoterCardFragment$data = {
  readonly id: string;
  readonly votes: ReadonlyArray<{
    readonly id: string;
  }>;
  readonly " $fragmentSpreads": FragmentRefs<"NounGridFragment">;
  readonly " $fragmentType": "VoterCardFragment";
};
export type VoterCardFragment$key = {
  readonly " $data"?: VoterCardFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"VoterCardFragment">;
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
  "name": "VoterCardFragment",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "Vote",
      "kind": "LinkedField",
      "name": "votes",
      "plural": true,
      "selections": [
        (v0/*: any*/)
      ],
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "NounGridFragment"
    }
  ],
  "type": "Delegate",
  "abstractKey": null
};
})();

(node as any).hash = "323ea8a7831b108cec5a5f67d72adbbb";

export default node;
