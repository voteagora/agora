import { css } from "@emotion/css";
import { VStack, HStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import RetroPGFBallotPageHeader from "./RetroPGFBallotPageHeader";
import { useLazyLoadQuery } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { useAccount } from "wagmi";
import { RetroPGFBallotPageQuery } from "./__generated__/RetroPGFBallotPageQuery.graphql";
import { RetroPGFBallotContent } from "./RetroPGFBallotContent";
import { RetroPGFIconListItem } from "../RetroPGFIconListItem";

export default function RetroPGFBallotPage() {
  const { address } = useAccount();

  const { citizen } = useLazyLoadQuery<RetroPGFBallotPageQuery>(
    graphql`
      query RetroPGFBallotPageQuery($delegateId: String!) {
        citizen: delegate(addressOrEnsName: $delegateId) {
          address {
            ...RetroPGFBallotPageHeaderFragment
          }
        }
      }
    `,
    { delegateId: address ?? "" }
  );
  return (
    <div>
      <RetroPGFBallotPageHeader fragmentRef={citizen.address} />
      <BallotContent />
    </div>
  );
}

function BallotContent() {
  return (
    <HStack
      justifyContent="space-between"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        width: 100%;
        padding: ${theme.spacing["4"]};
        @media (max-width: ${theme.maxWidth["2xl"]}) {
          flex-direction: column;
        }
      `}
    >
      <VStack
        className={css`
          width: 70%;
          text-align: left;
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            width: 100%;
          }
        `}
      >
        <RetroPGFBallotContent />
      </VStack>
      <div
        className={css`
          background: ${theme.colors.gray.fa};
          border: 1px solid ${theme.colors.gray["300"]};
          width: 30%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          border-radius: 0px 12px 12px 0px;
          border-left: none;
          position: relative;
          z-index: 0;
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            width: 100%;
            border-radius: 0px 0px 12px 12px;
            border-top: none;
            border-left: 1px solid ${theme.colors.gray["300"]};
          }
        `}
      >
        <VStack
          className={css`
            width: 100%;
            text-align: left;
          `}
        >
          <div
            className={css`
              border-bottom: 1px solid ${theme.colors.gray["300"]};
            `}
          >
            <p
              className={css`
                padding: ${theme.spacing["6"]};
              `}
            >
              <span
                className={css`
                  font-weight: ${theme.fontWeight["medium"]};
                `}
              >
                Your task:
              </span>{" "}
              As a badgeholder, you are tasked with upholding the principle of
              “impact = profit” – the idea that positive impact to the
              Collective should be rewarded with profit to the individual.
            </p>
          </div>
          <div
            className={css`
              padding-right: ${theme.spacing["6"]};
              padding-left: ${theme.spacing["6"]};
              margin-bottom: ${theme.spacing["6"]};
            `}
          >
            <div
              className={css`
                padding-top: ${theme.spacing["6"]};
              `}
            >
              Learn more about RetroPGF
            </div>
            <RetroPGFIconListItem
              text="Badgeholder's manual"
              href="https://www.optimism.io/badgeholder-manual"
              icon="op"
            />
          </div>
        </VStack>
      </div>
    </HStack>
  );
}
