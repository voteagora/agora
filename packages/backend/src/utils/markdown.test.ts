import exp from "constants";

import { marked } from "marked";

import dedent from "dedent";

import {
  extractFirstParagraph,
  getTitleFromProposalDescription,
  trimENSStatementHeader,
} from "./markdown";


describe("trimENSStatementHeader", () => {
  it("trims header for coinbase.eth", () => {
    expect(
      trimENSStatementHeader(dedent`
        **ENS name:**
        coinbase.eth
        
        **My reasons for wanting to be a delegate:**
        
        This is an application representing Coinbase, Inc. as an organization.
        
        ....
    `)
    ).toMatchInlineSnapshot(`
      "This is an application representing Coinbase, Inc. as an organization.

      ...."
    `);
  });

  it("trims header for brantly.eth", () => {
    expect(
      trimENSStatementHeader(dedent`
        **ENS name:** brantly.eth
        
        **My reasons for wanting to be a delegate:** I am passionate about ENS, have been on the core ENS team for almost three years, and now would like to contribute to DAO governance.
        
        **My view on each section of the [proposed ENS Constitution ](https://discuss.ens.domains/t/proposed-ens-constitution/814)**
        
        ...
    `)
    ).toMatchInlineSnapshot(`
      "I am passionate about ENS, have been on the core ENS team for almost three years, and now would like to contribute to DAO governance.

      **My view on each section of the [proposed ENS Constitution ](https://discuss.ens.domains/t/proposed-ens-constitution/814)**

      ..."
    `);
  });

  it("works for cory.eth", () => {
    expect(
      trimENSStatementHeader(dedent`
        **ENS Name:** cory.eth
        
        **My reasons for wanting to be a delegate**
        Personal Identity is a fundamental human right. In the digital world, our personal identity will be our web3 identity. It is critical that the technology underpinning personal identity on the Internet is governed through fair, open, transparent principles.
    `)
    ).toMatchInlineSnapshot(
      `"Personal Identity is a fundamental human right. In the digital world, our personal identity will be our web3 identity. It is critical that the technology underpinning personal identity on the Internet is governed through fair, open, transparent principles."`
    );
  });

  it("works for fireeyesdao.eth", () => {
    expect(
      trimENSStatementHeader(dedent`
        **ENS name:** Fireeyesdao.eth 
        
        
        **My reasons for wanting to be a delegate:** 🔥_ 🔥 (Fire Eyes DAO) has been working alongside the ENS core team up to the launch of ENS DAO, focused on ensuring a community first launch. 
        
        We’ve been overwhelmed with the focus, passion and coordination of the ENS core team and now we’re excited to play a role in the further decentralisation of the project by putting our collective hat in the ring to be a delegate!
    `)
    ).toMatchInlineSnapshot(`
      "🔥_ 🔥 (Fire Eyes DAO) has been working alongside the ENS core team up to the launch of ENS DAO, focused on ensuring a community first launch. 

      We’ve been overwhelmed with the focus, passion and coordination of the ENS core team and now we’re excited to play a role in the further decentralisation of the project by putting our collective hat in the ring to be a delegate!"
    `);
  });
});

describe("getTitleFromProposalDescription", () => {
  it("extracts simple title", () => {
    expect(
      getTitleFromProposalDescription(
        dedent`[EP2] Retrospective Airdrop 
        Enacts EP2 as approved by Snapshot vote, and described in full here: https://github.com/ensdomains/governance-docs/blob/main/governance-proposals/ep2-executable-retrospective-airdrop-for-accounts-that-owned-another-accounts-primary-ens-1.md`
      )
    ).toMatchInlineSnapshot(`"[EP2] Retrospective Airdrop"`);
  });

  it("extracts hash title", () => {
    expect(
      getTitleFromProposalDescription(dedent`
        # Execute EP7
        Executes all four EP7 sub-proposals as passed on Snapshot
    `)
    ).toMatchInlineSnapshot(`"Execute EP7"`);
  });
});

describe("extractFirstParagraph", () => {
  it("handles images links at the beginning", () => {
    const tokens = marked.lexer(dedent`
      ![](https://i.imgur.com/cEKQzYk.png)

      Hi, this is [Noun 22](https://nouns.wtf/noun/22).

      ### Who am I?
      After joining Nouns DAO in the first month of the project’s inception,
    `);

    expect(extractFirstParagraph(tokens)).toEqual("Hi, this is Noun 22.");
  });

  it("handles bold in first paragraph", () => {
    const tokens = marked.lexer(dedent`
      **About Me:** 
      I love Nouns and have been active in the ecosystem for 10+ months...
    `);

    expect(extractFirstParagraph(tokens)).toEqual(
      "About Me: I love Nouns and have been active in the ecosystem for 10+ months..."
    );
  });

  it("single line statements", () => {
    const tokens = marked.lexer(dedent`
      I'm optimistic on the future and believe all spending is useful.
    `);

    expect(extractFirstParagraph(tokens)).toEqual(
      `I'm optimistic on the future and believe all spending is useful.`
    );
  });
});
