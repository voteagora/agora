import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { VStack } from "../../components/VStack";
import { Link } from "../../components/HammockRouter/Link";
import { DelegateProfileImage } from "../../components/DelegateProfileImage";
import { VoterPanelActions } from "../../components/VoterPanel/VoterPanelActions";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
  contentClassName?: string;
};

export function VoterCard({ fragmentRef, contentClassName }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on Delegate {
        address {
          resolvedName {
            address
            name
          }
        }

        statement {
          summary
        }

        ...VoterPanelActionsFragment
        ...DelegateProfileImageFragment
      }
    `,
    fragmentRef
  );

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
        className={css`
          height: 100%;
          padding: ${theme.spacing["6"]};
          border-radius: ${theme.spacing["3"]};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          cursor: pointer;
        `}
      >
        <VStack
          gap="4"
          className={cx(
            contentClassName,
            css`
              height: 100%;
            `
          )}
        >
          <VStack justifyContent="center">
            <DelegateProfileImage fragment={delegate} />
          </VStack>

          {!!delegate.statement?.summary && (
            <div
              className={css`
                display: -webkit-box;

                color: #66676b;
                overflow: hidden;
                text-overflow: ellipsis;
                line-clamp: 5;
                -webkit-line-clamp: 5;
                -webkit-box-orient: vertical;
                font-size: ${theme.fontSize.base};
                line-height: ${theme.lineHeight.normal};
              `}
            >
              {delegate.statement.summary}
            </div>
          )}

          <div
            className={css`
              flex: 1;
            `}
          />

          <VoterPanelActions fragment={delegate} />
        </VStack>
      </VStack>
    </Link>
  );
}
