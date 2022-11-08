import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";
import { VoterCardDelegateProfileImage$key } from "./__generated__/VoterCardDelegateProfileImage.graphql";
import { Link } from "../../components/HammockRouter/Link";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";
import { ENSAvatar } from "../../components/ENSAvatar";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
};

export function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on WrappedDelegate {
        ...VoterPanelActionsFragment

        ...VoterCardDelegateProfileImage

        address {
          resolvedName {
            address
            name

            ...NounResolvedNameFragment
          }
        }

        statement {
          statement
          summary
        }

        delegate {
          id
          tokensRepresented {
            __typename
          }

          delegateMetrics {
            totalVotes
          }
        }
      }
    `,
    fragmentRef
  );

  return (
    <Link
      to={`/delegate/${
        delegate.address.resolvedName.name ??
        delegate.address.resolvedName.address
      }`}
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <VStack
        gap="4"
        className={css`
          height: 100%;
          padding: ${theme.spacing["6"]};
          border-radius: ${theme.spacing["3"]};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          cursor: pointer;
        `}
      >
        <VStack
          justifyContent="center"
          className={css`
            flex: 1;
          `}
        >
          <DelegateProfileImage fragment={delegate} />
        </VStack>

        {!!delegate.statement?.summary && (
          <div
            className={css`
              display: -webkit-box;

              color: #66676b;
              overflow: hidden;
              text-overflow: ellipsis;
              line-clamp: 5;
              -webkit-line-clamp: 5;
              -webkit-box-orient: vertical;
              font-size: ${theme.fontSize.base};
              line-height: ${theme.lineHeight.normal};
            `}
          >
            {delegate.statement.summary}
          </div>
        )}

        <VoterPanelActions fragment={delegate} />
      </VStack>
    </Link>
  );
}

export function DelegateProfileImage({
  fragment,
}: {
  fragment: VoterCardDelegateProfileImage$key;
}) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardDelegateProfileImage on WrappedDelegate {
        address {
          resolvedName {
            address

            ...NounResolvedNameFragment
            ...ENSAvatarFragment
          }
        }

        delegate {
          tokensRepresented {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }
      }
    `,
    fragment
  );

  return (
    <HStack gap="4">
      <ENSAvatar
        className={css`
          width: 44px;
          height: 44px;
          border-radius: 100%;
        `}
        fragment={delegate.address.resolvedName}
      />

      <VStack>
        <div
          className={css`
            font-size: ${theme.fontSize.base};
            font-weight: ${theme.fontWeight.semibold};
          `}
        >
          <NounResolvedName resolvedName={delegate.address.resolvedName} />
        </div>
        {delegate?.delegate && (
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.semibold};
              color: #4f4f4f;
            `}
          >
            <TokenAmountDisplay
              fragment={delegate.delegate.tokensRepresented.amount}
            />
          </div>
        )}
      </VStack>
    </HStack>
  );
}
