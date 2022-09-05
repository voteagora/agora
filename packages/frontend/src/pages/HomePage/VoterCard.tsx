import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";
import { HStack, VStack } from "../../components/VStack";
import { shadow } from "../DelegatePage/VoterPanel";
import { icons } from "../../icons/icons";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
};

export function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on WrappedDelegate {
        id

        address {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }

        statement {
          statement
          twitter
          discord
        }

        delegate {
          id

          votes {
            id
          }

          ...NounGridFragment
        }
      }
    `,
    fragmentRef
  );

  return (
    <Link to={`/delegate/${delegate.id}`}>
      <VStack
        className={css`
          padding: ${theme.spacing["4"]};

          border-radius: ${theme.borderRadius.lg};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border: ${theme.colors.gray.eb};
          border-style: solid;
          box-shadow: ${shadow};
          cursor: pointer;
        `}
      >
        {delegate.delegate ? (
          <NounsRepresentedGrid fragmentKey={delegate.delegate} />
        ) : (
          <HStack>
            <img src={icons.anonNoun} />
          </HStack>
        )}

        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["4"]};
          `}
        >
          <div
            className={css`
              font-weight: bold;
            `}
          >
            <NounResolvedName resolvedName={delegate.address.resolvedName} />
          </div>

          {delegate.delegate && (
            <div>Voted {delegate.delegate.votes.length} times</div>
          )}
        </HStack>

        {/*{delegate.statement?.statement && (*/}
        {/*  <Markdown markdown={delegate.statement?.statement} />*/}
        {/*)}*/}
      </VStack>
    </Link>
  );
}
