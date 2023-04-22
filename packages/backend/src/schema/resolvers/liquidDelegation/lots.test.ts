import { TestReader } from "../../../indexer/storage/testReader";
import { entityDefinitions } from "../../../indexer/contracts/entityDefinitions";

import { collectGenerator } from "../../../indexer/utils/generatorUtils";

import { EntitiesWithMetadata } from "../../../indexer/storage/entityStore";

import {
  makeDefaultRules,
  PERMISSION_PROPOSE,
  PERMISSION_SIGN,
  PERMISSION_VOTE,
  Rules,
} from "./rules";
import { delegatedToLots } from "./lots";

describe("delegatedToLots", () => {
  describe("simple environment with one proxy and one subdelegation", () => {
    function makeReader() {
      return TestReader.create(entityDefinitions, [
        {
          entity: "AlligatorProxy",
          id: "proxyA",
          value: {
            owner: "ownerA",
            proxy: "proxyA",
          },
        },
        makeSubdelegation("ownerA", "delegateB", makeDefaultRules()),
      ]);
    }

    it("works for delegate correctly", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "delegateB")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
              {
                "address": "delegateB",
                "rules": {
                  "blocksBeforeVoteCloses": 0,
                  "customRule": "0x0000000000000000000000000000000000000000",
                  "maxRedelegations": 0,
                  "notValidAfter": 0,
                  "notValidBefore": 0,
                  "permissions": 6,
                },
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });

    it("works for proxy owner correctly", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "ownerA")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });

    it("works for unknown", async () => {});
  });

  describe("complex environment", () => {
    function makeReader() {
      return TestReader.create(entityDefinitions, [
        {
          entity: "AlligatorProxy",
          id: "proxyA",
          value: {
            owner: "ownerA",
            proxy: "proxyA",
          },
        },
        makeSubdelegation("ownerA", "delegateB", {
          ...makeDefaultRules(),
          permissions: PERMISSION_SIGN,
        }),
        makeSubdelegation("ownerA", "delegateC", {
          ...makeDefaultRules(),
          permissions: PERMISSION_PROPOSE,
        }),
      ]);
    }

    it("works for delegateB", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "delegateB")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
              {
                "address": "delegateB",
                "rules": {
                  "blocksBeforeVoteCloses": 0,
                  "customRule": "0x0000000000000000000000000000000000000000",
                  "maxRedelegations": 0,
                  "notValidAfter": 0,
                  "notValidBefore": 0,
                  "permissions": 2,
                },
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });

    it("works for delegateC", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "delegateC")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
              {
                "address": "delegateC",
                "rules": {
                  "blocksBeforeVoteCloses": 0,
                  "customRule": "0x0000000000000000000000000000000000000000",
                  "maxRedelegations": 0,
                  "notValidAfter": 0,
                  "notValidBefore": 0,
                  "permissions": 4,
                },
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });

    it("works for proxy owner", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "ownerA")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });

    it("works for unknown", async () => {
      expect(
        await collectGenerator(delegatedToLots(makeReader(), "other"))
      ).toMatchInlineSnapshot(`[]`);
    });
  });

  describe("an environment with cycles", () => {
    function makeReader() {
      return TestReader.create(entityDefinitions, [
        {
          entity: "AlligatorProxy",
          id: "proxyA",
          value: {
            owner: "ownerA",
            proxy: "proxyA",
          },
        },
        makeSubdelegation("ownerA", "delegateB", makeDefaultRules()),
        makeSubdelegation("ownerA", "ownerA", makeDefaultRules()),
      ]);
    }

    it("works for proxy owner", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "ownerA")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });

    it("works for delegate", async () => {
      expect(await collectGenerator(delegatedToLots(makeReader(), "delegateB")))
        .toMatchInlineSnapshot(`
        [
          {
            "authorityChain": [
              {
                "address": "ownerA",
                "rules": null,
              },
              {
                "address": "delegateB",
                "rules": {
                  "blocksBeforeVoteCloses": 0,
                  "customRule": "0x0000000000000000000000000000000000000000",
                  "maxRedelegations": 0,
                  "notValidAfter": 0,
                  "notValidBefore": 0,
                  "permissions": 6,
                },
              },
            ],
            "owner": "ownerA",
            "proxy": "proxyA",
          },
        ]
      `);
    });
  });
});

function makeSubdelegation(
  from: string,
  to: string,
  rules: Rules
): EntitiesWithMetadata<typeof entityDefinitions> {
  return {
    entity: "AlligatorSubDelegation",
    id: [from, to].join("-"),
    value: {
      from,
      to,
      rules,
    },
  };
}
