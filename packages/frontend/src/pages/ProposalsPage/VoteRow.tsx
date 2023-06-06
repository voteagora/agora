import { UserIcon } from "@heroicons/react/20/solid";
import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { toSupportType } from "@agora/common";

import { HStack, VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { VoteReason } from "../../components/VoteReason";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { icons } from "../../icons/icons";

import { VoteRowFragment$key } from "./__generated__/VoteRowFragment.graphql";
import { VoteRowTextFragment$key } from "./__generated__/VoteRowTextFragment.graphql";

export function VoteRow({
  fragmentRef,
  onVoterHovered,
}: {
  fragmentRef: VoteRowFragment$key;
  onVoterHovered: (address: string) => void;
}) {
  const vote = useFragment(
    graphql`
      fragment VoteRowFragment on Vote {
        id

        reason
        votes {
          amount {
            amount
          }
        }

        voter {
          address {
            address
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
        }

        voter {
          address {
            address
          }
        }

        executor {
          address {
            address
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
        }

        ...VoteRowTextFragment
        ...VoteReasonFragment
      }
    `,
    fragmentRef
  );

  return (
    <VStack key={vote.id} gap="1">
      <VStack>
        <HStack
          justifyContent="space-between"
          className={css`
            color: ${theme.colors.gray["800"]};
            font-weight: ${theme.fontWeight.semibold};
            font-size: ${theme.fontSize.xs};
          `}
        >
          <HStack>
            <div
              onMouseEnter={() => onVoterHovered(vote.voter.address.address)}
            >
              <NounResolvedLink
                resolvedName={vote.voter.address.resolvedName}
              />
            </div>
            {vote.executor.address.address !== vote.voter.address.address && (
              <div
                onMouseEnter={() =>
                  onVoterHovered(vote.executor.address.address)
                }
              >
                {"("}
                <NounResolvedLink
                  resolvedName={vote.executor.address.resolvedName}
                />
                {")"}
              </div>
            )}

            <VoteText fragmentRef={vote} />
          </HStack>

          <HStack
            gap="1"
            alignItems="center"
            className={css`
              color: #66676b;
              font-size: ${theme.fontSize.xs};
            `}
          >
            {vote.votes.amount.amount}

            <div
              className={css`
                width: ${theme.spacing["3"]};
                height: ${theme.spacing["3"]};
              `}
            >
              <UserIcon />
            </div>
            {vote.voter.address.address !== vote.executor.address.address && (
              <img
                src={icons.liquid}
                alt="liquid delegation proxy indicator"
                className={css`
                  width: ${theme.spacing["3"]};
                `}
              />
            )}
          </HStack>
        </HStack>
      </VStack>

      {vote.reason && <VoteReason fragmentKey={vote} />}
    </VStack>
  );
}

function VoteText({ fragmentRef }: { fragmentRef: VoteRowTextFragment$key }) {
  const { supportDetailed } = useFragment(
    graphql`
      fragment VoteRowTextFragment on Vote {
        supportDetailed
      }
    `,
    fragmentRef
  );

  const supportType = toSupportType(supportDetailed);

  return (
    <div
      className={css`
        color: ${colorForSupportType(supportType)};
      `}
    >
      &nbsp;
      {(() => {
        switch (supportType) {
          case "AGAINST":
            return "voted against";

          case "ABSTAIN":
            return "abstained";

          case "FOR":
            return "voted for";
        }
      })()}
    </div>
  );
}
