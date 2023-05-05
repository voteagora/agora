import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";
import graphql from "babel-plugin-relay/macro";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { Link } from "./HammockRouter/Link";
import { icons } from "../icons/icons";
import { ProfileDropDownButton } from "./ProfileDropDownButton";

export const orgName = "ENS";

export function PageHeader() {
  return (
    <HStack
      alignItems="center"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        gap: ${theme.spacing["2"]};
        justify-content: space-between;
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
        <HStack gap="3" alignItems="center">
          <img alt="logo" src={logo} />

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
            {orgName} Agora
          </span>
        </HStack>
      </Link>

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
          <DesktopButton />
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
      </HStack>
    </HStack>
  );
}

export const DesktopButton = () => {
  const { address: accountAddress } = useAccount();

  const { delegate } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $address) @skip(if: $skip) {
          statement {
            __typename
          }

          ...ProfileDropDownButtonFragment
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
      {({ isConnected, isConnecting, show, hide, address, ensName }) => (
        <div
          className={css`
            background-color: ${theme.colors.gray.fa};
            border-radius: ${theme.borderRadius.full};
            cursor: pointer;
            :hover {
              background: ${theme.colors.gray[200]};
            }
          `}
        >
          {!accountAddress && (
            <div
              className={css`
                padding: ${theme.spacing[2]} ${theme.spacing[5]};
              `}
              onClick={show}
            >
              Connect Wallet
            </div>
          )}
          {accountAddress && delegate && (
            <ProfileDropDownButton
              isConnected={isConnected}
              isConnecting={isConnecting}
              show={show}
              hide={hide}
              address={address}
              ensName={ensName}
              fragment={delegate}
              hasStatment={!!delegate.statement}
            />
          )}
        </div>
      )}
    </ConnectKitButton.Custom>
  );
};

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
              <img
                src={icons.walletConnected}
                alt="connect wallet button"
                className={css`
                  opacity: 1;
                `}
              />
            ) : (
              <img
                src={icons.wallet}
                alt="connect wallet button"
                className={css`
                  opacity: 0.6;
                `}
              />
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
