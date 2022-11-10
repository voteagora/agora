import { query } from "./ensDelegateRelay";

describe.skip("query", () => {
  jest.setTimeout(100_000);

  it("works", async () => {
    expect(await query("0x81b287c0992b110adeb5903bf7e2d9350c80581a"))
      .toMatchInlineSnapshot(`
      Object {
        "next": 2022-11-08T00:00:00.000Z,
        "nonce": 0,
      }
    `);
  });
});
