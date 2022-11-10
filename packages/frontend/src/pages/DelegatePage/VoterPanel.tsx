import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { VoterPanelDelegateFragment$key } from "./__generated__/VoterPanelDelegateFragment.graphql";
import { icons } from "../../icons/icons";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelDelegateButtonFragment$key } from "./__generated__/VoterPanelDelegateButtonFragment.graphql";
import { VoterPanelActionsFragment$key } from "./__generated__/VoterPanelActionsFragment.graphql";
import { ReactNode, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { VoterPanelDelegateFromListFragment$key } from "./__generated__/VoterPanelDelegateFromListFragment.graphql";
import { VoterPanelNameSectionFragment$key } from "./__generated__/VoterPanelNameSectionFragment.graphql";
import { shortAddress } from "../../utils/address";
import { Textfit } from "react-textfit";
import { DelegateDialog } from "../../components/DelegateDialog";
import { useStartTransition } from "../../components/HammockRouter/HammockRouter";
import toast from "react-hot-toast";
import { DelegateProfileImage } from "../HomePage/VoterCard";
import { pluralizeAddresses } from "../../words";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";

type Props = {
  delegateFragment: VoterPanelDelegateFragment$key;
};

export function VoterPanel({ delegateFragment }: Props) {
  const address = useFragment(
    graphql`
      fragment VoterPanelDelegateFragment on Address {
        resolvedName {
          ...VoterPanelNameSectionFragment
        }

        wrappedDelegate {
          ...VoterCardDelegateProfileImage
          ...VoterPanelActionsFragment

          delegate {
            id

            delegateMetrics {
              totalVotes
              ofTotalProps
              proposalsCreated
            }

            tokensRepresented {
              __typename
              bpsOfQuorum
              bpsOfTotal
            }
            ...VoterPanelDelegateFromListFragment

            delegateMetrics {
              forVotes
              againstVotes
              abstainVotes
              ofLastTenProps
            }
          }
        }
      }
    `,
    delegateFragment
  );

  const delegate = address.wrappedDelegate.delegate;

  return (
    <VStack
      className={css`
        background-color: ${theme.colors.white};
        border-radius: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.newDefault};
      `}
    >
      <VStack
        alignItems="stretch"
        className={css`
          padding: ${theme.spacing["6"]};
          border-bottom: ${theme.spacing.px} solid ${theme.colors.gray["300"]};
        `}
      >
        <DelegateProfileImage fragment={address.wrappedDelegate} />
      </VStack>

      <div
        className={css`
          ${css`
            display: flex;
            flex-direction: column;
            padding: ${theme.spacing["6"]} ${theme.spacing["6"]};
          `};
        `}
      >
        <VStack gap="4">
          <PanelRow
            title="Proposals voted"
            detail={
              !delegate
                ? "N/A"
                : `${delegate.delegateMetrics.totalVotes} (${delegate.delegateMetrics.ofTotalProps}%)`
            }
          />

          <PanelRow
            title="For / Against / Abstain"
            detail={
              delegate
                ? `${delegate.delegateMetrics.forVotes} / ${delegate.delegateMetrics.againstVotes} / ${delegate.delegateMetrics.abstainVotes}`
                : "N/A"
            }
          />

          <PanelRow
            title={"Vote Power"}
            detail={
              !delegate
                ? "N/A"
                : `${bpsToString(
                    delegate.tokensRepresented.bpsOfTotal
                  )} all / ${bpsToString(
                    delegate.tokensRepresented.bpsOfQuorum
                  )} quorum`
            }
          />

          <PanelRow
            title="Recent activity"
            detail={
              delegate
                ? `${delegate.delegateMetrics.ofLastTenProps} of 10 last props`
                : "N/A"
            }
          />

          <PanelRow
            title="Proposals created"
            detail={`${delegate?.delegateMetrics?.proposalsCreated ?? "N/A"}`}
          />

          {delegate && <DelegateFromList fragment={delegate} />}

          <VoterPanelActions fragment={address.wrappedDelegate} />
        </VStack>
      </div>
    </VStack>
  );
}

function DelegateFromList({
  fragment,
}: {
  fragment: VoterPanelDelegateFromListFragment$key;
}) {
  const { delegateMetrics } = useFragment(
    graphql`
      fragment VoterPanelDelegateFromListFragment on Delegate {
        delegateMetrics {
          tokenHoldersRepresentedCount
        }
      }
    `,
    fragment
  );

  return (
    <VStack gap="1">
      <PanelRow
        title="Delegated from"
        detail={
          <div>
            <HStack
              alignItems="center"
              gap="1"
              className={css`
                cursor: pointer;
                user-select: none;
              `}
            >
              <div>
                {pluralizeAddresses(
                  delegateMetrics.tokenHoldersRepresentedCount
                )}
              </div>
            </HStack>
          </div>
        }
      />
    </VStack>
  );
}

export function VoterPanelActions({
  className,
  fragment,
}: {
  className?: string;
  fragment: VoterPanelActionsFragment$key;
}) {
  const wrappedDelegate = useFragment(
    graphql`
      fragment VoterPanelActionsFragment on WrappedDelegate {
        statement {
          twitter
          discord
        }

        ...VoterPanelDelegateButtonFragment
      }
    `,
    fragment
  );

  const statement = wrappedDelegate.statement;

  return (
    <HStack
      justifyContent="space-between"
      alignItems="stretch"
      className={className}
    >
      {statement && (
        <HStack gap="4" alignItems="center">
          {statement.twitter && (
            <a
              className={css`
                padding: ${theme.spacing["1"]};
              `}
              href={`https://twitter.com/${statement.twitter}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={icons.twitter} alt="twitter" />
            </a>
          )}

          {statement.discord && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast("copied discord handle to clipboard");

                navigator.clipboard.writeText(statement.discord);
              }}
            >
              <img src={icons.discord} alt="discord" />
            </button>
          )}
        </HStack>
      )}

      <DelegateButton
        fragment={wrappedDelegate}
        full={!statement || (!statement.twitter && !statement.discord)}
      />
    </HStack>
  );
}

function DelegateButton({
  fragment,
  full,
}: {
  fragment: VoterPanelDelegateButtonFragment$key;
  full: boolean;
}) {
  const wrappedDelegate = useFragment(
    graphql`
      fragment VoterPanelDelegateButtonFragment on WrappedDelegate {
        ...DelegateDialogFragment
      }
    `,
    fragment
  );

  const startTransition = useStartTransition();
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DelegateDialog
        fragment={wrappedDelegate}
        isOpen={isDialogOpen}
        closeDialog={() => setDialogOpen(false)}
        completeDelegation={() => {
          setDialogOpen(false);
        }}
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          startTransition(() => setDialogOpen(true));
        }}
        className={css`
          ${buttonStyles};
          ${full &&
          css`
            width: 100%;
          `}
        `}
      >
        Delegate
      </button>
    </>
  );
}

type PanelRowProps = {
  title: string;
  detail: ReactNode;
};

const PanelRow = ({ title, detail }: PanelRowProps) => {
  return (
    <HStack gap="2" justifyContent="space-between" alignItems="baseline">
      <span
        className={css`
          white-space: nowrap;
        `}
      >
        {title}
      </span>

      <span
        className={css`
          font-size: ${theme.fontSize.sm};
          color: #4f4f4f;
          text-align: right;
        `}
      >
        {detail}
      </span>
    </HStack>
  );
};

type NameSectionProps = {
  resolvedName: VoterPanelNameSectionFragment$key;
};

function NameSection({ resolvedName }: NameSectionProps) {
  const { address, name } = useFragment(
    graphql`
      fragment VoterPanelNameSectionFragment on ResolvedName {
        address
        name
      }
    `,
    resolvedName
  );

  const renderedAddress = shortAddress(address);

  return (
    <a href={`https://etherscan.io/address/${address}`}>
      <VStack>
        {name && (
          <div
            className={css`
              color: #66676b;
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              line-height: ${theme.lineHeight.relaxed};
            `}
          >
            {renderedAddress}
          </div>
        )}

        <div
          className={css`
            font-weight: ${theme.fontWeight.black};
            font-size: ${theme.fontSize["2xl"]};
            line-height: ${theme.lineHeight.tight};
            overflow: hidden;
          `}
        >
          <Textfit min={16} max={24} mode="single">
            {name ?? renderedAddress}
          </Textfit>
        </div>
      </VStack>
    </a>
  );
}

export const shadow =
  "0px 4px 12px rgba(0, 0, 0, 0.02), 0px 2px 2px rgba(0, 0, 0, 0.03);";

export type Comparator<T> = (a: T, b: T) => number;

export function descendingValueComparator<T>(
  getValueFor: (item: T) => number
): Comparator<T> {
  return (a, b) => {
    const aValue = getValueFor(a);
    const bValue = getValueFor(b);

    return bValue - aValue;
  };
}

export function bpsToString(bps: number) {
  return `${bps / 100}%`;
}
