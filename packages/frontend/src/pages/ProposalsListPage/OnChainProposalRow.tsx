import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack } from "../../components/VStack";
import { NounResolvedName } from "../../components/NounResolvedName";
import { formatDistanceToNow } from "date-fns";
import {
  OnChainProposalRowFragment$key,
  ProposalStatus,
} from "./__generated__/OnChainProposalRowFragment.graphql";
import { OnChainProposalRowActivityFragment$key } from "./__generated__/OnChainProposalRowActivityFragment.graphql";
import { StatusText } from "./StatusText";
import { Row, RowValue } from "./Rows";
import { shortenId } from "../DelegatePage/VoteDetails";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";

export function OnChainProposalRow({
  fragmentRef,
}: {
  fragmentRef: OnChainProposalRowFragment$key;
}) {
  const proposal = useFragment(
    graphql`
      fragment OnChainProposalRowFragment on Proposal {
        number
        status
        title
        proposalData {
          __typename
          ... on StandardProposalData {
            forVotes {
              ...TokenAmountDisplayFragment
            }
            againstVotes {
              ...TokenAmountDisplayFragment
            }
          }
          ... on ApprovalVotingProposalData {
            options {
              __typename
            }
          }
        }
        voteStartsAt
        voteEndsAt
        proposer {
          address {
            resolvedName {
              ...NounResolvedNameFragment
            }
          }
        }

        ...OnChainProposalRowActivityFragment
      }
    `,
    fragmentRef
  );
  const proposalsWithBadFormatting = [
    "114732572201709734114347859370226754519763657304898989580338326275038680037913",
    "27878184270712708211495755831534918916136653803154031118511283847257927730426",
    "90839767999322802375479087567202389126141447078032129455920633707568400402209",
  ];
  const testProposals = [
    "90839767999322802375479087567202389126141447078032129455920633707568400402209",
    "103606400798595803012644966342403441743733355496979747669804254618774477345292",
    "89934444025525534467725222948723300602129924689317116631018191521555230364343",
    "28601282374834906210319879956567232553560898502158891728063939287236508034960",
  ];

  // This is a hack to hide a proposal formatting mistake from the OP Foundation
  const shortTitle = proposalsWithBadFormatting.includes(proposal.number)
    ? proposal.title.split("-")[0].split("(")[0]
    : proposal.title;

  return (
    <Row path={`/proposals/${proposal.number}`}>
      <RowValue
        primary
        title={
          <>
            Prop {shortenId(proposal.number)} – by{" "}
            <NounResolvedName
              resolvedName={proposal.proposer.address.resolvedName}
            />
            <span
              className={css`
                @media (min-width: ${theme.maxWidth["2xl"]}) {
                  display: none;
                }
              `}
            >
              {" "}
              –{" "}
              <span
                className={css`
                  text-transform: lowercase;
                  color: ${colorForOnChainProposalStatus(proposal.status)};
                `}
              >
                {proposal.status}
              </span>
            </span>
          </>
        }
      >
        {shortTitle}
      </RowValue>

      <RowValue title={"Status"}>
        {testProposals.includes(proposal.number) ? (
          <StatusText
            className={css`
              color: ${theme.colors.gray[700]};
            `}
          >
            TEST PROP: {proposal.status}
          </StatusText>
        ) : (
          <StatusText
            className={css`
              color: ${colorForOnChainProposalStatus(proposal.status)};
            `}
          >
            {proposal.status}
          </StatusText>
        )}
      </RowValue>

      <Activity fragmentRef={proposal} />
    </Row>
  );
}

function Activity({
  fragmentRef,
}: {
  fragmentRef: OnChainProposalRowActivityFragment$key;
}) {
  const proposal = useFragment(
    graphql`
      fragment OnChainProposalRowActivityFragment on Proposal {
        voteEndsAt
        status
        voteStartsAt
        proposalData {
          __typename
          ... on StandardProposalData {
            forVotes {
              ...TokenAmountDisplayFragment
            }
            againstVotes {
              ...TokenAmountDisplayFragment
            }
          }
          ... on ApprovalVotingProposalData {
            forVotes {
              ...TokenAmountDisplayFragment
            }
            options {
              __typename
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const proposalData = proposal.proposalData;
  const voteEndsAt = new Date(proposal.voteEndsAt);
  const voteStartsAt = new Date(proposal.voteStartsAt);
  return (
    <RowValue
      title={(() => {
        switch (proposal.status) {
          case "PENDING":
            return "Voting";

          case "ACTIVE":
            return `Voting ends in ${formatDistanceToNow(voteEndsAt)}`;

          default:
            return `Voting ended ${formatDistanceToNow(voteEndsAt)} ago`;
        }
      })()}
    >
      <HStack>
        {(() => {
          switch (proposalData.__typename) {
            // TODO - change the condition once data is available
            case "StandardProposalData": {
              if (proposal.status === "PENDING") {
                return `Starts in ${formatDistanceToNow(
                  new Date(voteStartsAt)
                )}`;
              } else {
                return (
                  <HStack gap="1">
                    <span>
                      <TokenAmountDisplay
                        fragment={proposalData.forVotes}
                      ></TokenAmountDisplay>{" "}
                      For
                    </span>

                    <span
                      className={css`
                        color: ${theme.colors.gray[500]};
                      `}
                    >
                      -
                    </span>

                    <span>
                      <TokenAmountDisplay
                        fragment={proposalData.againstVotes}
                      ></TokenAmountDisplay>{" "}
                      Against
                    </span>
                  </HStack>
                );
              }
            }
            case "ApprovalVotingProposalData": {
              if (proposal.status === "PENDING") {
                return `Starts in ${formatDistanceToNow(
                  new Date(voteStartsAt)
                )}`;
              } else {
                return (
                  <HStack gap="1">
                    <p>{proposalData.options.length} Options</p>
                  </HStack>
                );
              }
            }
          }
        })()}
      </HStack>
    </RowValue>
  );
}

export function colorForOnChainProposalStatus(status: ProposalStatus) {
  switch (status) {
    case "DEFEATED":
    case "CANCELLED":
    case "VETOED":
    case "EXPIRED":
      return theme.colors.red[600];

    case "SUCCEEDED":
    case "EXECUTED":
    case "QUEUED":
      return theme.colors.green[600];

    case "PENDING":
      return theme.colors.black;

    case "ACTIVE":
      return theme.colors.blue[600];

    default:
      throw new Error(`unknown status type ${status}`);
  }
}
