import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack } from "../../../components/VStack";
import { RetroPGFListRow } from "../RetroPGFListRow";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFApplicationListContainerFragment$key } from "./__generated__/RetroPGFApplicationListContainerFragment.graphql";

export function RetroPGFApplicationListContainer({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationListContainerFragment$key;
}) {
  const { lists } = useFragment(
    graphql`
      fragment RetroPGFApplicationListContainerFragment on Project {
        lists {
          ...RetroPGFListRowFragment
        }
      }
    `,
    fragmentRef
  );

  return (
    <VStack
      justifyContent="space-between"
      className={css`
        padding: 0 ${theme.spacing["4"]};
      `}
    >
      <h2
        className={css`
          font-family: "Inter";
          font-style: normal;
          font-weight: 900;
          font-size: 24px;
          line-height: 29px;
          color: #000000;
          max-width: ${theme.maxWidth["6xl"]};
        `}
      >
        Included in lists
      </h2>
      <div
        className={css`
          max-height: calc(100vh - 148px);
          flex-shrink: 0;
          width: 100%;
          border: 1px solid ${theme.colors.gray.eb};
          border-radius: ${theme.borderRadius["xl"]};
          box-shadow: ${theme.boxShadow.newDefault};
          margin-top: ${theme.spacing["8"]};
          margin-bottom: ${theme.spacing["8"]};
          padding-left: 0;
          padding-right: 0;
          margin-left: 0;
          margin-right: 0;
          padding-top: 0;
          padding-bottom: 0;
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            width: 100%;
            height: auto;
          }
        `}
      >
        <div
          className={css`
            & > div:last-child {
              border-bottom: none;
            }
          `}
        >
          {lists.length === 0 && (
            <VStack
              alignItems="center"
              justifyContent="center"
              className={css`
                padding: ${theme.spacing["8"]};
                color: ${theme.colors.gray["700"]};
              `}
            >
              Not included in any lists
            </VStack>
          )}
          {lists.map((list, index) => (
            <RetroPGFListRow key={index} fragmentRef={list} />
          ))}
        </div>
      </div>
    </VStack>
  );
}
