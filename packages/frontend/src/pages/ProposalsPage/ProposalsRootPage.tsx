import { css, cx } from "@emotion/css";
import { useFragment } from "react-relay";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import graphql from "babel-plugin-relay/macro";
import { useLazyLoadQuery } from "react-relay/hooks";
import { ProposalsRootPageQuery } from "./__generated__/ProposalsRootPageQuery.graphql";
import { ProposalsRootPageProposalRowFragment$key } from "./__generated__/ProposalsRootPageProposalRowFragment.graphql";
import { Selector } from "../HomePage/Selector";
import { OverviewMetricsContainer } from "../HomePage/OverviewMetricsContainer";
import { formatDistanceToNow } from "date-fns";
import { utils } from "ethers";
import { startTransition, useState, useMemo } from "react";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { NounResolvedName } from "../../components/NounResolvedName";

export function ProposalsRootPage() {
  const result = useLazyLoadQuery<ProposalsRootPageQuery>(
    graphql`
      query ProposalsRootPageQuery {
        proposals(first: 1000, orderDirection: desc, orderBy: createdBlock) {
          id
          number
          actualStatus
          ...ProposalsRootPageProposalRowFragment
        }
        ...OverviewMetricsContainer
      }
    `,
    {}
  );

  const navigate = useNavigate();
  let setSelectedProposalID = (newProposalID: number) => {
    startTransition(() => {
      navigate({ path: `/proposals/${newProposalID}` });
    });
  };

  type Sort = "desc" | "asc";
  type Filter =
    | "ALL"
    | "ACTIVE"
    | "EXECUTED"
    | "PENDING"
    | "CANCELLED"
    | "VETOED"
    | "QUEUED";
  const [sort, setSort] = useState<Sort>("desc");
  const [filter, setFilter] = useState<Filter>("ALL");

  const displayedProposals = useMemo(() => {
    return result.proposals.filter(
      (proposal) => filter === "ALL" || proposal.actualStatus === filter
    );
  }, [filter, result.proposals]);

  const sortedProposals = useMemo(() => {
    switch (sort) {
      case "desc":
        return displayedProposals;

      case "asc":
        return displayedProposals.slice().reverse();
    }
  }, [displayedProposals, sort]);

  return (
    <>
      <VStack
        className={css`
          width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            max-width: 100%;
          }
        `}
      >
        <h1
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: bolder;
            padding: 0 ${theme.spacing["4"]};
            margin-bottom: ${theme.spacing["4"]};
          `}
        >
          Proposal metrics
        </h1>
        <OverviewMetricsContainer fragmentRef={result} />
      </VStack>
      <PageDivider />
      <HStack
        justifyContent="space-between"
        className={css`
          width: ${theme.maxWidth["6xl"]};
          padding: 0 ${theme.spacing["4"]};
          margin-top: ${theme.spacing["16"]};
          margin-bottom: ${theme.spacing["4"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            max-width: 100%;
          }
        `}
      >
        <h1
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: bolder;
          `}
        >
          All Proposals
        </h1>
        <HStack gap="4">
          <Selector
            items={[
              {
                title: "All",
                value: "ALL" as const,
              },
              {
                title: "Active",
                value: "ACTIVE" as const,
              },
              {
                title: "Pending",
                value: "PENDING" as const,
              },
              {
                title: "Cancelled",
                value: "CANCELLED" as const,
              },
              {
                title: "Executed",
                value: "EXECUTED" as const,
              },
              {
                title: "Defeated",
                value: "VETOED" as const,
              },
              {
                title: "Queued",
                value: "QUEUED" as const,
              },
            ]}
            value={filter}
            onChange={(newFilter) =>
              startTransition(() => setFilter(newFilter))
            }
            size={"l"}
          />
          <Selector
            items={[
              {
                title: "Newest",
                value: "desc" as const,
              },
              {
                title: "Oldest",
                value: "asc" as const,
              },
            ]}
            value={sort}
            onChange={(newSort) => startTransition(() => setSort(newSort))}
            size={"l"}
          />
        </HStack>
      </HStack>
      <VStack
        className={css`
          border: 1px solid ${theme.colors.gray[300]};
          border-radius: ${theme.borderRadius["xl"]};
          margin: ${theme.spacing["4"]} a ${theme.spacing["12"]} 0;
          background-color: ${theme.colors.white};
          @media (max-width: ${theme.maxWidth.lg}) {
            max-width: calc(100% - ${theme.spacing["8"]});
          }
        `}
      >
        {sortedProposals.map((proposal) => (
          <ProposalRow
            key={proposal.id}
            fragmentRef={proposal}
            onClick={() => {
              startTransition(() => {
                setSelectedProposalID(proposal.number);
              });
            }}
          />
        ))}
      </VStack>
    </>
  );
}

function ProposalRow({
  fragmentRef,
  onClick,
}: {
  fragmentRef: ProposalsRootPageProposalRowFragment$key;
  onClick: () => void;
}) {
  const proposal = useFragment(
    graphql`
      fragment ProposalsRootPageProposalRowFragment on Proposal {
        id
        number
        actualStatus
        title
        totalValue
        forVotes
        againstVotes
        abstainVotes
        totalVotes
        voteStartsAt
        voteEndsAt
        proposer {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }
      }
    `,
    fragmentRef
  );

  // const outcome =
  //   parseFloat(proposal.forVotes) > parseFloat(proposal.againstVotes);
  console.log("-");
  console.log(proposal.voteEndsAt);

  return (
    <div
      onClick={() => onClick()}
      className={css`
        cursor: pointer;
        box-sizing: border-box;
        width: calc(${theme.maxWidth["6xl"]} - ${theme.spacing["8"]});
        padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
        border-bottom: 1px solid ${theme.colors.gray[300]};
        transition: background-color 0.1s ease-in-out;
        :first-child {
          border-radius: ${theme.borderRadius["xl"]} ${theme.borderRadius["xl"]}
            0 0;
        }
        :hover {
          background: ${theme.colors.gray["fa"]};
        }
        :last-child {
          border-bottom: 0px;
          border-radius: 0 0 ${theme.borderRadius["xl"]}
            ${theme.borderRadius["xl"]};
        }
        @media (max-width: ${theme.maxWidth.lg}) {
          max-width: 100%;
        }
      `}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <VStack
          className={css`
            width: 50%;
            @media (max-width: ${theme.maxWidth.lg}) {
              width: 100%;
            }
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize["xs"]};
              color: ${theme.colors.gray[700]};
            `}
          >
            Prop {proposal.number} – by{" "}
            <NounResolvedName resolvedName={proposal.proposer.resolvedName} />
          </div>
          <div>{proposal.title}</div>
        </VStack>
        <VStack
          alignItems="flex-end"
          className={css`
            width: 13%;
            @media (max-width: ${theme.maxWidth.lg}) {
              display: none;
            }
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize["xs"]};
              color: ${theme.colors.gray[700]};
            `}
          >
            Status
          </div>
          <div
            className={cx(
              css`
                color: ${(() => {
                  switch (proposal.actualStatus) {
                    case "DEFEATED":
                    case "CANCELLED":
                    case "VETOED":
                      return theme.colors.red[600];

                    case "EXECUTED":
                    case "QUEUED":
                      return theme.colors.green[600];

                    case "PENDING":
                      return theme.colors.black;

                    case "ACTIVE":
                      return theme.colors.blue[600];
                  }
                })()};
                font-size: ${theme.fontSize["sm"]};
                font-weight: ${theme.fontWeight["medium"]};
              `
            )}
          >
            {proposal.actualStatus}
          </div>
        </VStack>
        <VStack
          alignItems="flex-end"
          className={css`
            width: 13%;
            @media (max-width: ${theme.maxWidth.lg}) {
              display: none;
            }
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize["xs"]};
              color: ${theme.colors.gray[700]};
            `}
          >
            Requesting
          </div>
          <div>
            {/* todo: use tokendisplayamount when we merge everything back together */}
            {parseFloat(utils.formatEther(proposal.totalValue)).toFixed(1)} ETH
          </div>
        </VStack>
        <VStack
          alignItems="flex-end"
          className={css`
            width: 24%;
            @media (max-width: ${theme.maxWidth.lg}) {
              display: none;
            }
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize["xs"]};
              color: ${theme.colors.gray[700]};
            `}
          >
            {proposal.actualStatus === "PENDING" && <span>Voting</span>}
            {proposal.actualStatus === "ACTIVE" && (
              <span>
                {" "}
                Voting ends in{" "}
                {formatDistanceToNow(Number(proposal.voteEndsAt * 1000))}
              </span>
            )}
            {proposal.actualStatus === "DEFEATED" && (
              <span>
                {" "}
                Voting ended{" "}
                {formatDistanceToNow(Number(proposal.voteEndsAt * 1000))} ago
              </span>
            )}
            {proposal.actualStatus === "EXECUTED" && (
              <span>
                {" "}
                Voting ended{" "}
                {formatDistanceToNow(Number(proposal.voteEndsAt * 1000))} ago
              </span>
            )}
            {proposal.actualStatus === "CANCELLED" && (
              <span>
                {" "}
                Voting ended{" "}
                {formatDistanceToNow(Number(proposal.voteEndsAt * 1000))} ago
              </span>
            )}
          </div>
          {proposal.actualStatus !== "PENDING" && (
            <div className={css``}>
              <span>{proposal.forVotes} For</span>
              <span
                className={css`
                  color: ${theme.colors.gray[500]};
                `}
              >
                {" "}
                -{" "}
              </span>
              <span>{proposal.againstVotes} Against</span>
              <span
                className={css`
                  color: ${theme.colors.gray[500]};
                `}
              >
                {" "}
              </span>
              {/* <span className={css``}>{proposal.abstainVotes} Abstain</span> */}
            </div>
          )}
          {proposal.actualStatus === "PENDING" && (
            <div>
              Starts in{" "}
              {formatDistanceToNow(Number(proposal.voteStartsAt * 1000))}
            </div>
          )}
        </VStack>
      </HStack>
    </div>
  );
}

function PageDivider() {
  return (
    <div
      className={css`
        background: ${theme.colors.gray["300"]};
        width: 100%;
        height: 1px;
        margin-top: -${theme.spacing["8"]};
        z-index: -1;
      `}
    />
  );
}
