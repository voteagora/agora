import { useFragment } from "react-relay";
import { useMemo } from "react";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterTabularFragment$key } from "./__generated__/VoterTabularFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";
import { HStack, VStack } from "../../components/VStack";
import { Link } from "../../components/HammockRouter/Link";
import { BigNumber } from "ethers";
import { pluralizeNoun, pluralizeProb, pluralizeOther } from "../../words";
import { descendingValueComparator } from "../../utils/sorting";
import { icons } from "../../icons/icons";
import toast from "react-hot-toast";
import { DelegateButton } from "../../components/VoterPanel/VoterPanelActions";

type VoterTabularProps = {
  fragmentRef: VoterTabularFragment$key;
};

export function VoterTabular({ fragmentRef }: VoterTabularProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterTabularFragment on Delegate {
        ...VoterPanelActionsDelegateButtonFragment

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
          twitter
          discord
        }

        tokensRepresented {
          amount {
            amount
          }
        }

        ...NounGridFragment

        delegateMetrics {
          totalVotes
        }

        tokenHoldersRepresented {
          address {
            resolvedName {
              ...NounResolvedNameFragment
            }
          }

          tokensOwned {
            amount {
              amount
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const nounsRepresented = BigNumber.from(
    delegate.tokensRepresented.amount.amount
  );

  const votesCast = BigNumber.from(delegate.delegateMetrics.totalVotes);

  const tokenHolders = useMemo(() => {
    return delegate.tokenHoldersRepresented
      .map((it) => ({
        tokensOwned: BigNumber.from(it.tokensOwned.amount.amount),
        it,
      }))
      .slice()
      .sort(descendingValueComparator((item) => item.tokensOwned.toNumber()));
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
          border-top: 1px solid ${theme.colors.gray.eb};
          cursor: pointer;
          font-size: ${theme.fontSize.sm};
          line-height: ${theme.lineHeight.tight};
        `}
      >
        <HStack
          alignItems="center"
          className={css`
            display: grid;
            grid-template-columns: 3fr 1fr 1fr 2fr 3fr 0.5fr 1fr;
            gap: ${theme.spacing["6"]};
            @media (max-width: ${theme.maxWidth["6xl"]}) {
              grid-template-columns: 3fr 1fr 1fr 2fr 0.5fr 0.5fr;
            }
            @media (max-width: ${theme.maxWidth["4xl"]}) {
              grid-template-columns: 3fr 1fr 1fr 0.5fr 0.5fr;
            }
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
            gap="1"
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

            <NounsRepresentedGrid
              fragmentKey={delegate}
              dense
              columns={20}
              gap={"0"}
              imageSize={"4"}
              rows={1}
              overflowFontSize="xs"
            />
          </VStack>

          <VStack gap="1" alignItems="normal">
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

          <VStack gap="1" alignItems="normal">
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
                <VStack
                  gap="1"
                  alignItems="normal"
                  className={css`
                    @media (max-width: ${theme.maxWidth["4xl"]}) {
                      display: none;
                    }
                  `}
                >
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
                <VStack
                  gap="1"
                  alignItems="normal"
                  className={css`
                    @media (max-width: ${theme.maxWidth["4xl"]}) {
                      display: none;
                    }
                  `}
                >
                  <div
                    className={css`
                      font-weight: ${theme.fontWeight.semibold};
                    `}
                  >
                    <NounResolvedName
                      resolvedName={tokenHolders[0].it.address.resolvedName}
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

          <VStack
            gap="1"
            alignItems="normal"
            className={css`
              @media (max-width: ${theme.maxWidth["6xl"]}) {
                display: none;
              }
            `}
          >
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
          <VStack gap="1" alignItems="normal">
            {delegate.statement && (
              <HStack gap="3" alignItems="center">
                {delegate.statement.twitter && (
                  <a
                    href={`https://twitter.com/${delegate.statement.twitter}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={icons.twitter}
                      alt="twitter"
                      width={16}
                      height={16}
                    />
                  </a>
                )}

                {delegate.statement.discord && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast("copied discord handle to clipboard");
                      navigator.clipboard.writeText(
                        delegate.statement?.discord ?? ""
                      );
                    }}
                  >
                    <img
                      src={icons.discord}
                      alt="discord"
                      width={16}
                      height={16}
                    />
                  </button>
                )}
              </HStack>
            )}{" "}
          </VStack>

          <DelegateButton
            fragment={delegate}
            full={
              !delegate.statement ||
              (!delegate.statement.twitter && !delegate.statement.discord)
            }
          />
        </HStack>
      </VStack>
    </Link>
  );
}
