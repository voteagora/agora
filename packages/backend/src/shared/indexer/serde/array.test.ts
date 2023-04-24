import { ethers } from "ethers";

import * as serde from "./index";

describe("array", () => {
  it("works", () => {
    const entity = serde.object({
      items: serde.array(
        serde.object({
          key: serde.bigNumber,
        })
      ),
    });

    expect(
      entity.serialize({
        items: [
          {
            key: ethers.BigNumber.from(0),
          },

          {
            key: ethers.BigNumber.from(1),
          },

          {
            key: ethers.BigNumber.from(2),
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "key": "0",
          },
          {
            "key": "1",
          },
          {
            "key": "2",
          },
        ],
      }
    `);
  });
});
