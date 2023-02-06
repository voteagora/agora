import { css } from "@emotion/css";
import * as Sentry from "@sentry/react";
import * as theme from "../theme";
import logo from "../logo.svg";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PageHeaderFragment$key } from "./__generated__/PageHeaderFragment.graphql";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { Suspense, useEffect } from "react";
import { Link } from "./HammockRouter/Link";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { useLocation } from "./HammockRouter/HammockRouter";

export const orgName = "Optimism";

export function PageHeader() {
  const isProposalsPageActive = useLocation().pathname.startsWith("/proposals");

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

        @media (max-width: ${theme.maxWidth.md}) {
          flex-direction: column;
          text-align: center;
        }
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
            `}
          >
            {orgName} Agora <span
             className={css`
             font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.normal};
              color: ${theme.colors.gray["500"]};
              margin-left: ${theme.spacing["1"]};
             `}
            >BETA</span>
          </span>
        </HStack>
      </Link>

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
          <Link to="/">
            <div
              className={css`
                padding: ${theme.spacing[1]} ${theme.spacing[4]};
                border-radius: ${theme.borderRadius.full};
                color: ${theme.colors.gray[700]};
                @media (max-width: ${theme.maxWidth.md}) {
                  font-size: ${theme.fontSize.sm};
                }
                ${!isProposalsPageActive &&
                css`
                  background-color: ${theme.colors.gray.fa};
                  color: inherit;
                `};
              `}
            >
              Voters
            </div>
          </Link>
          <Link to="/proposals">
            <div
              className={css`
                padding: ${theme.spacing[1]} ${theme.spacing[4]};
                border-radius: ${theme.borderRadius.full};
                color: ${theme.colors.gray[700]};
                @media (max-width: ${theme.maxWidth.md}) {
                  font-size: ${theme.fontSize.sm};
                }
                ${isProposalsPageActive &&
                css`
                  background-color: ${theme.colors.gray.fa};
                  color: inherit;
                `};
              `}
            >
              Proposals
            </div>
          </Link>
        </HStack>
      </>

      <HStack
        alignItems="center"
        gap="3"
        className={css`
          height: ${theme.spacing["6"]};

          @media (max-width: ${theme.maxWidth.md}) {
            height: auto;
            flex-direction: column;
            align-items: stretch;
          }
        `}
      >
        <HStack justifyContent="center">
          <ConnectKitButton mode="light" />
        </HStack>

        <Suspense fallback={null}>
          <PageHeaderContents />
        </Suspense>
      </HStack>
    </HStack>
  );
}

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

      {delegate && <OwnedValuePanel fragment={delegate} />}
    </HStack>
  );
}

type OwnedValuePanelProps = {
  fragment: PageHeaderFragment$key;
};

function OwnedValuePanel({ fragment }: OwnedValuePanelProps) {
  const delegate = useFragment(
    graphql`
      fragment PageHeaderFragment on Delegate {
        amountOwned {
          amount {
            ...TokenAmountDisplayFragment
          }
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
        <TokenAmountDisplay fragment={delegate.amountOwned.amount} />
      </HStack>
    </HStack>
  );
}
