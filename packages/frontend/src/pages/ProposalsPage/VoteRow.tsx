import { css } from "@emotion/css";
import { UserIcon } from "@heroicons/react/20/solid";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";

import { NounResolvedLink } from "../../components/NounResolvedLink";
import { HStack, VStack } from "../../components/VStack";
import { VoteReason } from "../../components/VoteReason";
import * as theme from "../../theme";
import {
  colorForSupportType,
  toSupportType,
} from "../DelegatePage/VoteDetailsContainer";

import { VoteRowFragment$key } from "./__generated__/VoteRowFragment.graphql";
import { VoteRowTextFragment$key } from "./__generated__/VoteRowTextFragment.graphql";

export function VoteRow({ fragmentRef }: { fragmentRef: VoteRowFragment$key }) {
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
            <NounResolvedLink resolvedName={vote.voter.address.resolvedName} />

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
