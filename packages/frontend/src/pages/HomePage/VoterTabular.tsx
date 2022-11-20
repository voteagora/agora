import { useFragment } from "react-relay";
import { useMemo } from "react";
import graphql from "babel-plugin-relay/macro";
import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { VoterTabularFragment$key } from "./__generated__/VoterTabularFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { DelegateProfileImage } from "../../components/DelegateProfileImage";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";
import { Link } from "../../components/HammockRouter/Link";
import { BigNumber } from "ethers";
import { pluralizeNoun, pluralizeVote, pluralizeOthers } from "../../words";
import { descendingValueComparator } from "../../utils/sorting";

type VoterTabularProps = {
  fragmentRef: VoterTabularFragment$key;
};

export function VoterTabular({ fragmentRef }: VoterTabularProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterTabularFragment on WrappedDelegate {
        ...VoterPanelActionsFragment

        ...DelegateProfileImageFragment

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
          delegatedVotesRaw
          nounsRepresented {
            __typename
          }

          voteSummary {
            totalVotes
          }

          tokenHoldersRepresented {
            address {
              resolvedName {
                ...NounResolvedNameFragment
              }
            }

            nouns {
              id
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const nounsRepresented = BigNumber.from(
    delegate.delegate?.delegatedVotesRaw ?? "0"
  );

  const votesCast = BigNumber.from(
    delegate.delegate?.voteSummary?.totalVotes ?? 0
  );

  const tokenHolders = useMemo(() => {
    return delegate.delegate?.tokenHoldersRepresented
      .filter((holder) => !!holder.nouns.length)
      .slice()
      .sort(descendingValueComparator((item) => item.nouns.length));
  }, [delegate]);

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
        <HStack
          justifyContent="center"
          alignItems="center"
          className={css`
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));

            @media (max-width: ${theme.maxWidth["2xl"]}) {
              grid-template-rows: 1fr;
              grid-template-columns: none;
              overflow-y: scroll;
            }
          `}
        >
          <VStack
            justifyContent="center"
            alignItems="flex-start"
            className={css`
              flex: 1;
            `}
          >
            <div
              className={css`
                font-weight: ${theme.fontWeight.semibold};
              `}
            >
              <NounResolvedName resolvedName={delegate.address.resolvedName} />
            </div>
            <DelegateProfileImage fragment={delegate} />
          </VStack>

          <TitleDetail
            detail={`${pluralizeNoun(nounsRepresented)} represented`}
            value={nounsRepresented.toString()}
          />

          <TitleDetail
            detail={`${pluralizeVote(votesCast)} props voted on`}
            value={votesCast.toString()}
          />

          {(() => {
            if (!tokenHolders?.length) {
              return (
                <div
                  className={css`
                    padding: ${theme.spacing["12"]};
                    padding-bottom: ${theme.spacing["4"]};
                  `}
                >
                  Currently seeking delegation
                </div>
              );
            } else {
              return (
                <VStack gap="1" alignItems="center">
                  <div>
                    <NounResolvedName
                      resolvedName={tokenHolders[0].address.resolvedName}
                    />
                    {tokenHolders.length > 1 &&
                      ` + ${pluralizeOthers(tokenHolders.length - 1)}`}
                  </div>

                  <div>delegated to them</div>
                </VStack>
              );
            }
          })()}

          <VoterPanelActions fragment={delegate} />
        </HStack>
      </VStack>
    </Link>
  );
}

type TitleDetailProps = {
  detail: string;
  value: string;
};

function TitleDetail({ detail, value }: TitleDetailProps) {
  return (
    <HStack gap="1" alignItems="center">
      <div
        className={cx(
          css`
            font-size: ${theme.fontSize.sm};
            white-space: nowrap;
          `,
          "test"
        )}
      >
        {detail}
      </div>
    </HStack>
  );
}
