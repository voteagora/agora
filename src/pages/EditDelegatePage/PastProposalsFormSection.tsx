import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PastProposalsFormSectionProposalListFragment$key } from "./__generated__/PastProposalsFormSectionProposalListFragment.graphql";
import { getTitleFromProposalDescription } from "../../utils/markdown";
import { sharedInputStyle } from "./TopIssuesFormSection";
import { CloseIcon } from "../../components/CloseIcon";
import useClickOutside from "@restart/ui/useClickOutside";

type Props = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
};

export function PastProposalsFormSection({ queryFragment }: Props) {
  const [mostValuableProposals, setMostValuableProposals] = useState<
    SelectedProposal[]
  >([]);

  const [leastValuableProposals, setLeastValuableProposals] = useState<
    SelectedProposal[]
  >([]);

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

        <div
          className={css`
            display: flex;
            flex-direction: row;
            gap: ${theme.spacing["4"]};
          `}
        >
          <ProposalList
            selectedProposals={mostValuableProposals}
            setSelectedProposals={setMostValuableProposals}
            title="Most valuable"
            queryFragment={queryFragment}
          />

          <ProposalList
            selectedProposals={leastValuableProposals}
            setSelectedProposals={setLeastValuableProposals}
            title="Least valuable"
            queryFragment={queryFragment}
          />
        </div>
      </div>
    </div>
  );
}

type ProposalListProps = {
  title: string;
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
  setSelectedProposals: (
    updater: (oldProposals: SelectedProposal[]) => SelectedProposal[]
  ) => void;
  selectedProposals: SelectedProposal[];
};

function ProposalList({
  title,
  queryFragment,
  selectedProposals,
  setSelectedProposals,
}: ProposalListProps) {
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

  const mappedProposals: SearchableProposal[] = useMemo(
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

  const firstStageFilteredProposals = useMemo(
    () => proposalsMatchingText(mappedProposals, filterText),
    [mappedProposals, filterText]
  );

  const filteredProposals = useMemo(
    () =>
      proposalsNotIncludingSelected(
        firstStageFilteredProposals,
        selectedProposals
      ),
    [firstStageFilteredProposals, selectedProposals]
  );

  const removeSelectedProposal = useCallback(
    function removeSelectedProposal(id: string) {
      setSelectedProposals((oldProposals) =>
        oldProposals.filter((proposal) => proposal.id !== id)
      );
    },
    [setSelectedProposals]
  );

  const selectedProposalsWithSearchableProposal = useMemo(
    () =>
      selectedProposals.flatMap((selectedProposal) => {
        const proposal = mappedProposals.find(
          (needle) => needle.id === selectedProposal.id
        );
        if (!proposal) {
          return [];
        }

        return proposal;
      }),
    [selectedProposals, mappedProposals]
  );

  const handleSuggestedProposalClicked = useCallback(
    function handleSuggestedProposalClicked(proposal: SearchableProposal) {
      setSelectedProposals((last) => [...last, { id: proposal.id }]);
      setFilterText("");
    },
    [setSelectedProposals, setFilterText]
  );

  const focusContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const setFocused = useCallback(() => {
    setIsFocused(true);
  }, [setIsFocused]);

  const setBlurred = useCallback(() => {
    setIsFocused(false);
  }, [setIsFocused]);

  useClickOutside(focusContainerRef, setBlurred);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        margin-top: ${theme.spacing["4"]};
        gap: ${theme.spacing["2"]};
      `}
    >
      <h3
        className={css`
          font-size: ${theme.fontSize.sm};
          font-weight: bold;
        `}
      >
        {title}
      </h3>

      {selectedProposalsWithSearchableProposal.map((proposal) => (
        <ProposalCard
          proposal={proposal}
          onClose={() => removeSelectedProposal(proposal.id)}
        />
      ))}

      <div
        ref={focusContainerRef}
        className={css`
          display: flex;
          flex-direction: column;
          gap: ${theme.spacing["2"]};

          position: relative;
        `}
      >
        <input
          className={css`
            ${sharedInputStyle}
          `}
          placeholder="Start typing to search proposals "
          type="text"
          value={filterText}
          onFocus={setFocused}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: ${theme.spacing["2"]};
            position: absolute;
            background: white;

            top: 100%;
            left: 0;
            right: 0;
          `}
        >
          {isFocused &&
            filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onClick={() => handleSuggestedProposalClicked(proposal)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

type SelectedProposal = {
  id: string;
};

type SearchableProposal = {
  id: string;
  title: string | null;
  searchValue: string;
};

function proposalsNotIncludingSelected(
  proposals: SearchableProposal[],
  selected: SelectedProposal[]
): SearchableProposal[] {
  return proposals.filter(
    (searchableProposal) =>
      !selected.find(
        (selectedProposal) => selectedProposal.id === searchableProposal.id
      )
  );
}

function proposalsMatchingText(
  proposals: SearchableProposal[],
  filterText: string
): SearchableProposal[] {
  return proposals.filter((proposal) =>
    proposal.searchValue.includes(filterText.toLowerCase())
  );
}

type ProposalCardProps = {
  proposal: SearchableProposal;
  onClick?: () => void;
  onClose?: () => void;
};

function ProposalCard({ proposal, onClick, onClose }: ProposalCardProps) {
  return (
    <div
      onClick={onClick}
      className={css`
        border-radius: ${theme.borderRadius.md};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        ${onClick &&
        css`
          cursor: pointer;

          :hover {
            background: ${theme.colors.gray["200"]};
          }
        `}
      `}
    >
      <div
        className={css`
          padding: ${theme.spacing["2"]};
        `}
      >
        #{proposal.id} - {proposal.title}
      </div>

      {onClose && (
        <div
          onClick={onClose}
          className={css`
            border-radius: ${theme.borderRadius.md};
            cursor: pointer;
            color: ${theme.colors.gray["500"]};
            margin: ${theme.spacing["1"]};

            :hover {
              color: ${theme.colors.gray["600"]};
              background: ${theme.colors.gray["200"]};
            }
          `}
        >
          <CloseIcon
            className={css`
              width: ${theme.spacing["6"]};
              height: ${theme.spacing["6"]};
              margin: ${theme.spacing["1"]};
            `}
          />
        </div>
      )}
    </div>
  );
}
