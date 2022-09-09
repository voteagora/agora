import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";
import { HStack, VStack } from "../../components/VStack";
import { icons } from "../../icons/icons";
import { Link } from "../../components/HammockRouter/HammockRouter";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
};

export function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on WrappedDelegate {
        id
        ...VoterPanelActionsFragment

        address {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }

        statement {
          statement
          summary
        }

        delegate {
          id

          votes {
            id
          }

          nounsRepresented {
            id
          }

          ...NounGridFragment
        }
      }
    `,
    fragmentRef
  );

  return (
    <Link
      to={`/delegate/${delegate.id}`}
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <VStack
        gap="4"
        className={css`
          max-height: 28rem;
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
        {!!delegate?.delegate?.nounsRepresented?.length ? (
          <VStack
            justifyContent="center"
            alignItems="center"
            className={css`
              flex: 1;
            `}
          >
            <NounsRepresentedGrid
              rows={3}
              columns={5}
              gap="4"
              imageSize="12"
              overflowFontSize="base"
              fragmentKey={delegate.delegate}
            />
          </VStack>
        ) : (
          <HStack>
            <img src={icons.anonNoun} />
          </HStack>
        )}

        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["2"]};
          `}
        >
          <div
            className={css`
              font-weight: ${theme.fontWeight.semibold};
            `}
          >
            <NounResolvedName resolvedName={delegate.address.resolvedName} />
          </div>

          {delegate.delegate && (
            <div>Voted {delegate.delegate.votes.length} times</div>
          )}
        </HStack>

        {delegate.statement?.summary && (
          <div
            className={css`
              color: #66676b;
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {delegate.statement.summary}
          </div>
        )}

        <VoterPanelActions fragment={delegate} />
      </VStack>
    </Link>
  );
}
