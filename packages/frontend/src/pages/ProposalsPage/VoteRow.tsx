import { UserIcon } from "@heroicons/react/20/solid";
import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { toSupportType } from "@agora/common";
import { useEnsAvatar } from "wagmi";

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
              address
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
              address
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

  const avatar = useEnsAvatar({
    address: vote.voter.address.resolvedName.address as any,
  });
  const executorAvatar = useEnsAvatar({
    address: vote.executor.address.resolvedName.address as any,
  });

  return (
    <VStack key={vote.id} gap="1">
      <VStack>
        <HStack
          justifyContent="space-between"
          alignItems="center"
          className={css`
            color: ${theme.colors.gray["800"]};
            font-weight: ${theme.fontWeight.semibold};
            font-size: ${theme.fontSize.xs};
          `}
        >
          <HStack alignItems="center">
            {vote.executor.address.address !== vote.voter.address.address ? (
              <div
                onMouseEnter={() => onVoterHovered(vote.voter.address.address)}
              >
                <HStack gap="2" alignItems="center">
                  <img
                    className={css`
                      width: 24px;
                      height: 24px;
                      border-radius: ${theme.borderRadius.md};
                    `}
                    src={executorAvatar.data || icons.anonNoun}
                    alt={"anon noun"}
                  />
                  <NounResolvedLink
                    resolvedName={vote.executor.address.resolvedName}
                  />
                </HStack>
              </div>
            ) : (
              <div
                onMouseEnter={() => onVoterHovered(vote.voter.address.address)}
              >
                <HStack gap="2" alignItems="center">
                  <img
                    className={css`
                      width: 24px;
                      height: 24px;
                      border-radius: ${theme.borderRadius.md};
                    `}
                    src={avatar.data || icons.anonNoun}
                    alt={"anon noun"}
                  />
                  <NounResolvedLink
                    resolvedName={vote.voter.address.resolvedName}
                  />
                </HStack>
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
