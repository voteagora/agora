import { useParams } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { PageHeader } from "../../components/PageHeader";
import { VoterPanel } from "./VoterPanel";

export function DelegatePage() {
  const { delegateId } = useParams();

  const query = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!) {
        ...DelegatePageVoterPanelFragment @arguments(id: $id)
      }
    `,
    {
      id: delegateId ?? "",
    }
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: ${theme.fontFamily.sans};
        width: 100%;
      `}
    >
      <PageHeader />

      <div
        className={css`
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          gap: ${theme.spacing["16"]};
          margin: ${theme.spacing["16"]} 0;
          padding: 0 ${theme.spacing["16"]};
          width: 100%;
        `}
      >
        <div
          className={css`
            width: ${theme.maxWidth.sm};
          `}
        >
          <VoterPanel fragment={query} />
        </div>

        <div
          className={css`
            height: 300px;
            background: blue;
            width: 100%;
          `}
        >
          test
        </div>
      </div>
    </div>
  );
}
