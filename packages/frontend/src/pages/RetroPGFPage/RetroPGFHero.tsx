import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import RetroPGFBallotStatusCard from "./RetroPGFBallotStatusCard";
import sunny from "./sunny.svg";
import { useSIWE } from "connectkit";
import { RetroPGFBallotStatusCardFragment$key } from "./__generated__/RetroPGFBallotStatusCardFragment.graphql";

export function RetroPGFHero({
  fragmentRef,
}: {
  fragmentRef: RetroPGFBallotStatusCardFragment$key;
}) {
  const { isSignedIn } = useSIWE();

  const cls1 = css`
    max-width: 40%;
  `;
  const cls2 = css`
    max-width: 60%;
  `;

  const foo = isSignedIn;
  const bar = !isSignedIn;

  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      className={css`
        width: ${theme.maxWidth["6xl"]};
        padding: ${theme.spacing["4"]} ${theme.spacing["4"]};
        margin-bottom: ${theme.spacing["8"]};
        @media (max-width: ${theme.maxWidth.md}) {
          flex-direction: column;
          text-align: center;
          max-width: 100%;
          margin-bottom: 0;
        }
      `}
    >
      <VStack
        className={cx(
          { [cls1]: foo },
          { [cls2]: bar },
          css`
            @media (max-width: ${theme.maxWidth.md}) {
              margin-top: 0;
              max-width: 100%;
              margin-bottom: ${theme.spacing["10"]};
            }
          `
        )}
      >
        <h1
          className={css`
            font-weight: ${theme.fontWeight.extrabold};
            font-size: ${theme.fontSize["2xl"]};
            margin-bottom: ${theme.spacing["2"]};
          `}
        >
          Voting for RetroPGF 3 is live!
        </h1>

        <p
          className={css`
            color: ${theme.colors.gray["700"]};
            font-size: ${theme.fontSize.base};
          `}
        >
          As a badgeholder, you are tasked with upholding the principle of
          “impact = profit” &ndash; the idea that positive impact to the
          Collective should be rewarded with profit to the individual.
        </p>
      </VStack>
      {isSignedIn ? (
        <RetroPGFBallotStatusCard fragmentRef={fragmentRef} />
      ) : (
        <img
          className={css`
            max-width: ${theme.maxWidth["md"]};
            @media (max-width: ${theme.maxWidth.md}) {
              position: absolute;
              top: 272px;
            }
          `}
          src={sunny}
          alt="optimism background"
        />
      )}
    </HStack>
  );
}
