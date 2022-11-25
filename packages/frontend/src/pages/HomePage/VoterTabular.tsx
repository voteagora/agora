import { useFragment } from "react-relay";
import { useMemo } from "react";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterTabularFragment$key } from "./__generated__/VoterTabularFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";
import { Link } from "../../components/HammockRouter/Link";
import { BigNumber } from "ethers";
import { pluralizeNoun, pluralizeProb, pluralizeOther } from "../../words";
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

          ...NounGridFragment

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
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          cursor: pointer;
          font-size: ${theme.fontSize.sm};
          line-height: ${theme.lineHeight.tight};
        `}
      >
        <HStack
          justifyContent="center"
          alignItems="center"
          className={css`
            display: grid;
            grid-template-columns: 260px 90px 80px 155px 255px 4fr;
            gap: ${theme.spacing["6"]};
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
                font-size: ${theme.fontSize.base};
                line-height: ${theme.lineHeight.normal};
                font-weight: ${theme.fontWeight.semibold};
              `}
            >
              <NounResolvedName resolvedName={delegate.address.resolvedName} />
            </div>
            {delegate.delegate && (
              <NounsRepresentedGrid
                fragmentKey={delegate.delegate}
                dense
                columns={20}
                gap={"0"}
                imageSize={"4"}
                rows={1}
                overflowFontSize="xs"
              />
            )}
          </VStack>

          <VStack gap="0" alignItems="normal">
            <div
              className={css`
                font-weight: ${theme.fontWeight.semibold};
              `}
            >{`${pluralizeNoun(nounsRepresented)}`}</div>
            <div
              className={css`
                color: #66676b;
              `}
            >
              represented
            </div>
          </VStack>

          <VStack gap="0" alignItems="normal">
            <div
              className={css`
                font-weight: ${theme.fontWeight.semibold};
              `}
            >{`${pluralizeProb(votesCast)}`}</div>
            <div
              className={css`
                color: #66676b;
              `}
            >
              voted on
            </div>
          </VStack>

          {(() => {
            if (!tokenHolders?.length) {
              return (
                <VStack gap="0" alignItems="normal">
                  <div
                    className={css`
                      color: #66676b;
                    `}
                  >
                    Currently seeking delegation
                  </div>
                </VStack>
              );
            } else {
              return (
                <VStack gap="0" alignItems="normal">
                  <div
                    className={css`
                      font-weight: ${theme.fontWeight.semibold};
                    `}
                  >
                    <NounResolvedName
                      dense
                      resolvedName={tokenHolders[0].address.resolvedName}
                    />
                    {tokenHolders.length > 1 &&
                      ` + ${pluralizeOther(tokenHolders.length - 1)}`}
                  </div>

                  <div
                    className={css`
                      color: #66676b;
                    `}
                  >
                    delegated to them
                  </div>
                </VStack>
              );
            }
          })()}

          <VStack gap="0" alignItems="normal">
            {(() => {
              if (!delegate.statement?.summary) {
                return null;
              } else {
                return (
                  <div
                    className={css`
                      display: -webkit-box;

                      color: #66676b;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      line-clamp: 2;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                    `}
                  >
                    {delegate.statement.summary}
                  </div>
                );
              }
            })()}
          </VStack>

          <VoterPanelActions
            fragment={delegate}
            className={css`
              justify-content: space-evenly;
            `}
          />
        </HStack>
      </VStack>
    </Link>
  );
}
