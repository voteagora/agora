import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useMemo, useState } from "react";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PastProposalsFormSectionProposalListFragment$key } from "./__generated__/PastProposalsFormSectionProposalListFragment.graphql";
import { getTitleFromProposalDescription } from "../../utils/markdown";

type Props = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
};

export function PastProposalsFormSection({ queryFragment }: Props) {
  return (
    <div
      className={css`
        border-bottom-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        padding: ${theme.spacing["8"]} ${theme.spacing["6"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
        `}
      >
        <h3
          className={css`
            font-weight: bold;
          `}
        >
          Views on past proposals
        </h3>

        <ProposalList queryFragment={queryFragment} />
      </div>
    </div>
  );
}

type ProposalListProps = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
};

function ProposalList({ queryFragment }: ProposalListProps) {
  const { allProposals } = useFragment(
    graphql`
      fragment PastProposalsFormSectionProposalListFragment on Query {
        allProposals: proposals(
          first: 1000
          orderDirection: desc
          orderBy: createdBlock
        ) {
          id
          description
        }
      }
    `,
    queryFragment
  );

  const [filterText, setFilterText] = useState("");

  const mappedProposals = useMemo(
    () =>
      allProposals.map((proposal) => {
        const title = getTitleFromProposalDescription(proposal.description);

        return {
          id: proposal.id,
          title,
          searchValue: `#${proposal.id} ${title ?? ""}`.toLowerCase(),
        };
      }),
    [allProposals]
  );

  const filteredProposals = useMemo(() => {
    if (!filterText) {
      return mappedProposals.slice(0, 10);
    }

    return mappedProposals.filter((proposal) =>
      proposal.searchValue.includes(filterText.toLowerCase())
    );
  }, [mappedProposals, filterText]);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <input type="text" onChange={(e) => setFilterText(e.target.value)} />

      {filterText}

      {filteredProposals.map((proposal) => (
        <div id={proposal.id}>
          #{proposal.id} - {proposal.title}
        </div>
      ))}
    </div>
  );
}
