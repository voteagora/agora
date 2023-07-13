import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useAccount } from "wagmi";
import { HStack, VStack } from "../../components/VStack";
import graphql from "babel-plugin-relay/macro";
import { useLazyLoadQuery } from "react-relay/hooks";
import { OverviewMetricsContainer } from "../HomePage/OverviewMetricsContainer";
import { OnChainProposalRow } from "./OnChainProposalRow";
import { ProposalsListPageQuery } from "./__generated__/ProposalsListPageQuery.graphql";
import { PageDivider } from "../../components/PageDivider";
import NonVotedProposalsList from "./NonVotedProposalsList";

export default function ProposalsListPage() {
  const { address } = useAccount();

  const result = useLazyLoadQuery<ProposalsListPageQuery>(
    graphql`
      query ProposalsListPageQuery {
        proposals {
          ...OnChainProposalRowFragment
        }

        ...OverviewMetricsContainerFragment
      }
    `,
    {}
  );

  return (
    <>
      <VStack
        className={css`
          width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            display: none;
          }
        `}
      >
        <h1
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: ${theme.fontWeight["extrabold"]};
            padding: 0 ${theme.spacing["4"]};
            margin-bottom: ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["lg"]}) {
              margin-bottom: 0px;
            }
          `}
        >
          Proposal metrics
        </h1>
        <OverviewMetricsContainer fragmentRef={result} />
      </VStack>

      <PageDivider />

      <VStack
        className={css`
          max-width: ${theme.maxWidth["6xl"]};
          padding: 0 ${theme.spacing["4"]};
        `}
      >
        {address && <NonVotedProposalsList address={address} />}

        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["16"]};
            margin-bottom: ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["lg"]}) {
              max-width: 100%;
              flex-direction: column;
              margin-bottom: ${theme.spacing["0"]};
              margin-top: ${theme.spacing["4"]};
            }
          `}
        >
          <h1
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight["extrabold"]};
              @media (max-width: ${theme.maxWidth["lg"]}) {
                margin-bottom: ${theme.spacing["0"]};
              }
            `}
          >
            All Proposals
          </h1>
          <HStack gap="4"></HStack>
        </HStack>

        <VStack
          className={css`
            margin: ${theme.spacing["4"]} 0 ${theme.spacing["12"]} 0;
            border: 1px solid ${theme.colors.gray[300]};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow["newDefault"]};
            overflow: hidden;
          `}
        >
          <table
            className={css`
              table-layout: fixed;
              width: 100%;
              border-collapse: collapse;
              background-color: ${theme.colors.white};
            `}
          >
            <tbody>
              {result.proposals.map((proposal, idx) => {
                return <OnChainProposalRow key={idx} fragmentRef={proposal} />;
              })}
            </tbody>
          </table>
        </VStack>
      </VStack>
    </>
  );
}
