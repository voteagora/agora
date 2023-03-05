import { css } from "@emotion/css";
import * as Sentry from "@sentry/react";
import * as theme from "../theme";
import logo from "../logo.svg";
import { NounGridChildren } from "./NounGrid";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PageHeaderFragment$key } from "./__generated__/PageHeaderFragment.graphql";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { ReactNode, Suspense, useEffect } from "react";
import { Link } from "./HammockRouter/Link";
import { icons } from "../icons/icons";
import { PROPOSALS_ENABLED, useLocation } from "./HammockRouter/HammockRouter";
import { BigNumber } from "ethers";

export function PageHeader() {
  const location = useLocation();

  const activePage = (() => {
    if (
      location.pathname.startsWith("/proposals") ||
      location.pathname.startsWith("/auction")
    ) {
      return "PROPOSALS";
    }

    if (location.pathname.startsWith("/voteauction")) {
      return "AUCTION";
    }
    if (location.pathname.startsWith("/voters")) {
      return "VOTERS";
    }

    return "PROPOSALS";
  })();

  return (
    <HStack
      justifyContent="space-between"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        gap: ${theme.spacing["2"]};
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      <Link
        className={css`
          display: flex;
          flex-direction: row;
          justify-content: center;
        `}
        to="/"
      >
        <HStack gap="2" alignItems="center" className={css``}>
          <img
            alt="logo"
            src={logo}
            className={css`
              height: 16px;
              width: 16px;
            `}
          />

          <span
            className={css`
              white-space: nowrap;
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              color: ${theme.colors.gray["800"]};
              @media (max-width: ${theme.maxWidth.md}) {
                display: none;
              }
            `}
          >
            Nouns Agora
          </span>
        </HStack>
      </Link>

      {PROPOSALS_ENABLED && (
        <>
          <HStack
            className={css`
              background-color: ${theme.colors.white};
              border-radius: ${theme.borderRadius.full};
              border: 1px solid ${theme.colors.gray.eb};
              padding: ${theme.spacing[1]};
              font-weight: ${theme.fontWeight.medium};
              box-shadow: ${theme.boxShadow.newDefault};
            `}
          >
            <Link to="/voters">
              <LinkContents isActive={activePage === "VOTERS"}>
                Voters
              </LinkContents>
            </Link>

            <Link to="/proposals">
              <LinkContents isActive={activePage === "PROPOSALS"}>
                Proposals
              </LinkContents>
            </Link>

            <Link to="/voteauction">
              <LinkContents isActive={activePage === "AUCTION"}>
                Auction
              </LinkContents>
            </Link>
          </HStack>
        </>
      )}

      <HStack
        alignItems="center"
        gap="3"
        className={css`
          height: ${theme.spacing["6"]};
        `}
      >
        <HStack
          justifyContent="center"
          className={css`
            @media (max-width: ${theme.maxWidth.md}) {
              display: none;
            }
          `}
        >
          <ConnectKitButton mode="light" />
        </HStack>
        <HStack
          justifyContent="center"
          className={css`
            @media (min-width: ${theme.maxWidth.md}) {
              display: none;
            }
          `}
        >
          <MobileButton />
        </HStack>
        <HStack
          className={css`
            @media (max-width: ${theme.maxWidth.md}) {
              display: none;
            }
          `}
        >
          <Suspense fallback={null}>
            <PageHeaderContents />
          </Suspense>
        </HStack>
      </HStack>
    </HStack>
  );
}

type LinkContentsProp = {
  isActive: boolean;
  children: ReactNode;
};

function LinkContents({ children, isActive }: LinkContentsProp) {
  return (
    <div
      className={css`
        padding: ${theme.spacing[1]} ${theme.spacing[4]};
        border-radius: ${theme.borderRadius.full};
        color: ${theme.colors.gray[700]};
        @media (max-width: ${theme.maxWidth.md}) {
          font-size: ${theme.fontSize.sm};
        }
        ${isActive &&
        css`
          background-color: ${theme.colors.gray.fa};
          color: inherit;
        `};
      `}
    >
      {children}
    </div>
  );
}

export const MobileButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName }) => {
        return (
          <div
            className={css`
              margin-top: 13px;
            `}
            onClick={show}
          >
            {isConnected ? (
              <img src={icons.walletConnected} alt="connect wallet button" />
            ) : (
              <img src={icons.wallet} alt="connect wallet button" />
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

function PageHeaderContents() {
  const { address: accountAddress } = useAccount();

  useEffect(() => {
    Sentry.setUser({
      id: accountAddress,
    });
  }, [accountAddress]);

  const { delegate } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $address) @skip(if: $skip) {
          statement {
            __typename
          }

          ...PageHeaderFragment
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  return (
    <HStack gap="2" justifyContent="center">
      {delegate && (
        <Link
          to="/create"
          className={css`
            border-radius: ${theme.borderRadius.lg};
            border-width: ${theme.spacing.px};
            padding: ${theme.spacing["1"]} ${theme.spacing["2"]};
            color: ${theme.colors.gray["200"]};
            background: ${theme.colors.black};
            display: flex;
            flex-direction: column;
            justify-content: center;

            :hover {
              background: ${theme.colors.gray["800"]};
            }
          `}
        >
          <div>{!!delegate.statement ? "Edit" : "Create"}</div>
        </Link>
      )}

      {delegate && <OwnedNounsPanel fragment={delegate} />}
    </HStack>
  );
}

type OwnedNounsPanelProps = {
  fragment: PageHeaderFragment$key;
};

function OwnedNounsPanel({ fragment }: OwnedNounsPanelProps) {
  const { tokensOwned, nounsOwned } = useFragment(
    graphql`
      fragment PageHeaderFragment on Delegate {
        tokensOwned {
          amount {
            amount
          }
        }

        nounsOwned {
          # eslint-disable-next-line relay/unused-fields
          id
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...NounImageFragment
        }
      }
    `,
    fragment
  );

  return (
    <HStack
      className={css`
        border-color: ${theme.colors.gray["300"]};
        border-width: ${theme.spacing.px};
        border-radius: ${theme.borderRadius.lg};
        box-shadow: ${theme.boxShadow.newDefault};
        background: ${theme.colors.white};
      `}
    >
      <HStack
        gap="1"
        className={css`
          align-items: center;

          padding: ${theme.spacing["1"]} ${theme.spacing["2"]};
        `}
      >
        <NounGridChildren
          count={4}
          totalNouns={BigNumber.from(tokensOwned.amount.amount).toNumber()}
          nouns={nounsOwned}
          imageSize={"5"}
          overflowFontSize={"sm"}
        />
      </HStack>
    </HStack>
  );
}
