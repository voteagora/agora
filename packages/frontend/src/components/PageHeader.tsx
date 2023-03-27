import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";
import graphql from "babel-plugin-relay/macro";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { ReactNode } from "react";
import { Link } from "./HammockRouter/Link";
import { icons } from "../icons/icons";
import { useLocation } from "./HammockRouter/HammockRouter";
import { useMediaQuery } from "react-responsive";
import { ProfileDropDown } from "./ProfileDropDown";

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
    if (
      location.pathname.startsWith("/voters") ||
      location.pathname.startsWith("/delegate")
    ) {
      return "VOTERS";
    }

    return "PROPOSALS";
  })();

  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      <div
        className={css`
          padding: ${theme.spacing["2"]};
          background-color: ${theme.colors.purple["200"]};
          color: ${theme.colors.purple["700"]};
          width: 100%;
          text-align: center;
          font-size: ${theme.fontSize["sm"]};
        `}
      >
        <span>
          Hack Week is here! Nouns is giving 99 ETH in prizes to builders and
          creators of all backgrounds.
        </span> {" "}
        <a
          href="https://hackweek.wtf/"
          target="_BLANK"
          rel="noreferrer"
          className={css`
            font-weight: ${theme.fontWeight.semibold};
          `}
        >
          Make something Nounish this week →
        </a>
      </div>
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

        <HStack
          alignItems="center"
          gap="3"
          className={css`
            height: ${theme.spacing["6"]};
          `}
        >
          <ConnectWalletButton />
        </HStack>
      </HStack>
    </div>
  );
}

function ConnectWalletButton() {
  const isMobile = useMediaQuery({
    query: `(max-width: ${theme.maxWidth.md})`,
  });

  if (isMobile) {
    return <MobileButton />;
  }

  return <DesktopButton />;
}

function DesktopButton() {
  const { address: accountAddress } = useAccount();

  const { delegate } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $address) @skip(if: $skip) {
          ...ProfileDropDownFragment
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  return (
    <ConnectKitButton.Custom>
      {({ show }) => (
        <div
          className={css`
            border: 1px solid ${theme.colors.gray.eb};
            background-color: ${theme.colors.gray.fa};
            border-radius: ${theme.borderRadius.full};
            transition: 0.3s background-color;
            position: relative;
            top: 10px;

            :hover {
              background: ${theme.colors.gray.eb};
            }
          `}
        >
          {delegate ? (
            <ProfileDropDown fragment={delegate} />
          ) : (
            <div
              className={css`
                padding: ${theme.spacing[2]} ${theme.spacing[5]};
                cursor: pointer;
              `}
              onClick={show}
            >
              Connect Wallet
            </div>
          )}
        </div>
      )}
    </ConnectKitButton.Custom>
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
      {({ isConnected, show }) => {
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
