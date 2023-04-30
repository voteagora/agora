import { paginateArray } from "./pagination";

describe("paginateArray", () => {
  it("works for page shorter than total items", () => {
    expect(paginateArray([1, 2, 3, 4], 2, null)).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "0",
            "node": 1,
          },
          {
            "cursor": "1",
            "node": 2,
          },
        ],
        "pageInfo": {
          "endCursor": "1",
          "hasNextPage": true,
          "hasPreviousPage": false,
          "startCursor": null,
        },
      }
    `);
  });

  it("works for page equal to total items", () => {
    expect(paginateArray([1, 2, 3, 4], 4, null)).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "0",
            "node": 1,
          },
          {
            "cursor": "1",
            "node": 2,
          },
          {
            "cursor": "2",
            "node": 3,
          },
          {
            "cursor": "3",
            "node": 4,
          },
        ],
        "pageInfo": {
          "endCursor": "3",
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": null,
        },
      }
    `);
  });

  it("works for page longer than total items", () => {
    expect(paginateArray([1, 2, 3, 4], 24, null)).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "0",
            "node": 1,
          },
          {
            "cursor": "1",
            "node": 2,
          },
          {
            "cursor": "2",
            "node": 3,
          },
          {
            "cursor": "3",
            "node": 4,
          },
        ],
        "pageInfo": {
          "endCursor": "3",
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": null,
        },
      }
    `);
  });

  it("works for page ending on pagination boundary", () => {
    expect(paginateArray([1, 2, 3, 4], 2, "1")).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "2",
            "node": 3,
          },
          {
            "cursor": "3",
            "node": 4,
          },
        ],
        "pageInfo": {
          "endCursor": "3",
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": null,
        },
      }
    `);
  });

  it("works for page going past pagination boundary", () => {
    expect(paginateArray([1, 2, 3, 4], 12, "1")).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "2",
            "node": 3,
          },
          {
            "cursor": "3",
            "node": 4,
          },
        ],
        "pageInfo": {
          "endCursor": "3",
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": null,
        },
      }
    `);
  });

  it("fails when an invalid cursor is passed", () => {
    expect(() =>
      paginateArray([1, 2, 3, 4], 2, "invalid")
    ).toThrowErrorMatchingInlineSnapshot(`"invalid cursor invalid"`);
  });
});
