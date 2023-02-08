import { BigNumber } from "ethers";

export function* generateBarsForVote(
  forVotes: BigNumber,
  abstainVotes: BigNumber,
  againstVotes: BigNumber
) {
  const sections = [
    {
      amount: forVotes,
      value: "FOR" as const,
    },
    {
      amount: abstainVotes,
      value: "ABSTAIN" as const,
    },
    {
      amount: againstVotes,
      value: "AGAINST" as const,
    },
  ];

  const defaultSectionIndex = 1;

  const bars = 57;

  const totalVotes = sections.reduce(
    (acc, value) => acc.add(value.amount),
    BigNumber.from(0)
  );

  for (let index = 0; index < bars; index++) {
    if (totalVotes.eq(0)) {
      yield sections[defaultSectionIndex].value;
    }

    const value = BigNumber.from(totalVotes).mul(index).div(bars);

    let lastSectionValue = BigNumber.from(0);
    for (const section of sections) {
      const sectionAmount = section.amount;
      if (value.lt(lastSectionValue.add(sectionAmount))) {
        yield section.value;
        break;
      }

      lastSectionValue = lastSectionValue.add(sectionAmount);
    }
  }
}
