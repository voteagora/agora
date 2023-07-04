import { css } from "@emotion/css";
import { graphql } from "react-relay";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { ReactNode } from "react";
import { useMediaQuery } from "react-responsive";

import * as theme from "../theme";
import logo from "../logo.svg";
import { icons } from "../icons/icons";

import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { Link } from "./HammockRouter/Link";
import { useLocation } from "./HammockRouter/HammockRouter";
import { ProfileDropDown } from "./ProfileDropDown";

export function PageHeader() {
  const location = useLocation();

  const activePage = (() => {
    if (
      location.pathname.startsWith("/proposals")
      //|| location.pathname.startsWith("/auction")
    ) {
      return "PROPOSALS";
    }

    // if (location.pathname.startsWith("/voteauction")) {
    //   return "AUCTION";
    // }
    if (
      location.pathname.startsWith("/voters") ||
      location.pathname.startsWith("/delegate")
    ) {
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
          <LinkContents isActive={activePage === "VOTERS"}>Voters</LinkContents>
        </Link>

        <Link to="/proposals">
          <LinkContents isActive={activePage === "PROPOSALS"}>
            Proposals
          </LinkContents>
        </Link>

        {/* <Link to="/voteauction">
          <LinkContents isActive={activePage === "AUCTION"}>
            Auction
          </LinkContents>
        </Link> */}
      </HStack>

      <HStack
        alignItems="center"
        gap="3"
        className={css`
          height: ${theme.spacing["6"]};
        `}
      >
        <SocialLinks />
        <ConnectWalletButton />
      </HStack>
    </HStack>
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

export const SocialLinks = () => {
  const isMobile = useMediaQuery({
    query: `(max-width: ${theme.maxWidth.md})`,
  });

  const socialLinks = [
    {
      icon: icons.discord,
      alt: "discord",
      url: "https://discord.gg/dM2ZhvvZ", // Replace with your Discord URL
    },
    {
      icon: icons.twitter,
      alt: "twitter",
      url: "https://twitter.com/nounsagora", // Replace with your Twitter URL
    },
  ];

  if (isMobile) {
    return null;
  }

  return (
    <HStack gap="3" alignItems="center">
      {socialLinks.map(({ icon, alt, url }, index) => (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={css`
            img {
              margin-top: 22px;
              height: ${theme.spacing["4"]};
              width: ${theme.spacing["4"]};
              vertical-align: middle;
            }
          `}
        >
          <img src={icon} alt={alt} />
        </a>
      ))}
    </HStack>
  );
};
