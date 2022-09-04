import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
};

export function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on Delegate {
        id

        votes {
          id
        }

        resolvedName {
          ...NounResolvedNameFragment
        }

        ...NounGridFragment
      }
    `,
    fragmentRef
  );

  return (
    <Link to={`/delegate/${delegate.id}`}>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: ${theme.spacing["4"]};

          border-radius: ${theme.borderRadius.lg};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border: ${theme.colors.gray["300"]};
          border-style: solid;
          box-shadow: ${theme.boxShadow.lg};
          cursor: pointer;

          :hover {
            box-shadow: ${theme.boxShadow.xl};
          }
        `}
      >
        <NounsRepresentedGrid fragmentKey={delegate} />
        <div
          className={css`
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            margin-top: ${theme.spacing["4"]};
          `}
        >
          <div>
            <NounResolvedName resolvedName={delegate.resolvedName} />
          </div>

          <div>Voted {delegate.votes.length} times</div>
        </div>
      </div>
    </Link>
  );
}
