import { assignPendingVotes } from "./assignPendingVotes";

describe("assignPendingVotes", () => {
  it("works in the simple case with one pending vote and one bucket", () =>
    expect(
      Array.from(
        assignPendingVotes(
          [
            {
              address: "A",
              availableVotingPower: 10,
            },
          ],
          [
            {
              votes: 5,
              proposalNumber: 1,
            },
          ]
        )
      )
    ).toMatchInlineSnapshot(`
        Array [
          Object {
            "address": "A",
            "proposalNumber": 1,
            "weight": 5,
          },
        ]
      `));

  it("splits votes across multiple buckets when needed", () =>
    expect(
      Array.from(
        assignPendingVotes(
          [
            {
              address: "A",
              availableVotingPower: 1,
            },

            {
              address: "B",
              availableVotingPower: 1,
            },

            {
              address: "C",
              availableVotingPower: 1,
            },
          ],
          [
            {
              votes: 3,
              proposalNumber: 1,
            },
          ]
        )
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "A",
          "proposalNumber": 1,
          "weight": 1,
        },
        Object {
          "address": "B",
          "proposalNumber": 1,
          "weight": 1,
        },
        Object {
          "address": "C",
          "proposalNumber": 1,
          "weight": 1,
        },
      ]
    `));

  it("applies multiple pending votes to a single available voting power slot", () =>
    expect(
      Array.from(
        assignPendingVotes(
          [
            {
              address: "A",
              availableVotingPower: 10,
            },
          ],

          [
            {
              votes: 1,
              proposalNumber: 1,
            },

            {
              votes: 1,
              proposalNumber: 2,
            },
          ]
        )
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "A",
          "proposalNumber": 1,
          "weight": 1,
        },
        Object {
          "address": "A",
          "proposalNumber": 2,
          "weight": 1,
        },
      ]
    `));
});
