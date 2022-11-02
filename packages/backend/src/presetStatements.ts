import { z } from "zod";
import { formSchema } from "./formSchema";
import { StoredStatement } from "./model";

export function initialFields(): z.TypeOf<typeof formSchema> {
  return {
    delegateStatement: "",
    openToSponsoringProposals: null,
    twitter: "",
    discord: "",
    mostValuableProposals: [],
    leastValuableProposals: [],
    topIssues: [],
    for: "nouns-agora",
  };
}

export function makeStoredStatement(
  address: string,
  fields: Partial<z.TypeOf<typeof formSchema>>
): StoredStatement {
  return {
    address: address,
    updatedAt: Date.now(),
    signature: "",
    signedPayload: JSON.stringify({
      ...initialFields(),
      ...fields,
    }),
  };
}

function makeStoredStatementEntry(
  address: string,
  fields: Partial<z.TypeOf<typeof formSchema>>
): [string, StoredStatement] {
  const normalizedAddress = address.toLowerCase();
  return [normalizedAddress, makeStoredStatement(normalizedAddress, fields)];
}

export const presetDelegateStatements = new Map<string, StoredStatement>([
  makeStoredStatementEntry("0xfe349ddff44ba087530c1efc3342e786dffc57b0", {
    delegateStatement: "Just a guy with a noun.",
  }),
  makeStoredStatementEntry("0xf1544ba9a1ad3c8c8b507de3e1f5243c3697e367", {
    delegateStatement:
      "I'm optimistic on the future and believe all spending is useful.",
    mostValuableProposals: [
      {
        number: 121,
      },
      {
        number: 87,
      },
      {
        number: 77,
      },
    ],
  }),
  makeStoredStatementEntry("0xa1e4f7dc1983fefe37e2175524ebad87f1c78c3c", {
    delegateStatement: "Just a guy with a few nouns.",
  }),
  makeStoredStatementEntry("0x2573c60a6d127755aa2dc85e342f7da2378a0cc5", {
    delegateStatement:
      "We are a group of Nounish builders and representatives from launched Nounish NFT extension projects, coming together to participate in Nouns DAO governance.",
    twitter: "nouncil",
    mostValuableProposals: [
      {
        number: 121,
      },
      {
        number: 87,
      },
      {
        number: 77,
      },
    ],
    leastValuableProposals: [{ number: 127 }, { number: 122 }, { number: 74 }],
    topIssues: [
      {
        type: "proliferation",
        value:
          "Proliferation, above revenue generation, should be the number one focus.",
      },
      {
        type: "treasury",
        value:
          "We believe that active management of the treasury is a distraction.",
      },
    ],
  }),
  makeStoredStatementEntry("0xc3fdadbae46798cd8762185a09c5b672a7aa36bb", {
    delegateStatement:
      "I am the co-founder of Vector DAO and builder of prop 87. As long time designer and software builder, I plan on using my votes to advocate for and shepard through high quality projects that either creatively proliferate the meme, and contribute software to better functioning of the DAO.",
    for: "nouns-agora",
    twitter: "zhayitong",
    discord: "yitong#9038",

    mostValuableProposals: [
      {
        number: 121,
      },
      {
        number: 87,
      },
      {
        number: 77,
      },
    ],
    leastValuableProposals: [{ number: 127 }, { number: 122 }, { number: 74 }],
    topIssues: [
      {
        type: "proliferation",
        value:
          "Proliferation, above revenue generation, should be the number one focus.",
      },
      {
        type: "treasury",
        value:
          "We believe that active management of the treasury is a distraction.",
      },
    ],
  }),
]);
