import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";
import { Link } from "react-router-dom";
import { NounGridChildren } from "./NounGrid";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PageHeaderFragment$key } from "./__generated__/PageHeaderFragment.graphql";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";

export function PageHeader() {
  const { address: accountAddress } = useAccount();

  const { address } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: ID!, $skip: Boolean!) {
        address(address: $address) @skip(if: $skip) {
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
    <div
      className={css`
        display: flex;
        flex-direction: row;
        width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        padding: 0 ${theme.spacing["4"]};
        justify-content: space-between;
      `}
    >
      <Link
        className={css`
          display: flex;
          flex-direction: column;
          justify-content: center;
        `}
        to="/"
      >
        <div
          className={css`
            display: flex;
            flex-direction: row;
            gap: ${theme.spacing["4"]};
          `}
        >
          <img alt="logo" src={logo} />

          <span
            className={css`
              font-size: ${theme.fontSize.sm};
              color: ${theme.colors.gray["700"]};
            `}
          >
            Nouns Agora
          </span>
        </div>
      </Link>

      <div
        className={css`
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: ${theme.spacing["3"]};
        `}
      >
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

        <ConnectKitButton mode="light" />

        {address && <OwnedNounsPanel fragment={address} />}
      </div>
    </div>
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
    <div
      className={css`
        border-color: ${theme.colors.gray["300"]};
        border-width: ${theme.spacing.px};
        border-radius: ${theme.borderRadius.lg};
        box-shadow: ${theme.boxShadow.md};

        display: flex;
        flex-direction: row;
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: row;
          gap: ${theme.spacing["1"]};
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
      </div>
    </div>
  );
}
