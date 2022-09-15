import { css } from "@emotion/css";
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
import { Suspense } from "react";
import { Link } from "./HammockRouter/Link";

export function PageHeader() {
  return (
    <HStack
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        gap: ${theme.spacing["2"]};
        justify-content: space-between;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};

        @media (max-width: ${theme.maxWidth.sm}) {
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
        <HStack gap="3">
          <img alt="logo" src={logo} />

          <span
            className={css`
              white-space: nowrap;
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              color: ${theme.colors.gray["800"]};
            `}
          >
            Nouns Agora
          </span>
        </HStack>
      </Link>

      <HStack
        alignItems="center"
        gap="3"
        className={css`
          height: ${theme.spacing["6"]};

          @media (max-width: ${theme.maxWidth.sm}) {
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

  const { address } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: String!, $skip: Boolean!) {
        address(addressOrEnsName: $address) @skip(if: $skip) {
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
    <>
      {address && (
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
          <div>Create</div>
        </Link>
      )}

      {address && <OwnedNounsPanel fragment={address} />}
    </>
  );
}

type OwnedNounsPanelProps = {
  fragment: PageHeaderFragment$key;
};

function OwnedNounsPanel({ fragment }: OwnedNounsPanelProps) {
  const { account } = useFragment(
    graphql`
      fragment PageHeaderFragment on Address {
        account {
          nouns {
            id
            ...NounImageFragment
          }
        }
      }
    `,
    fragment
  );

  if (!account || !account.nouns.length) {
    return null;
  }

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
          nouns={account.nouns}
          imageSize={"5"}
          overflowFontSize={"sm"}
        />
      </HStack>
    </HStack>
  );
}
