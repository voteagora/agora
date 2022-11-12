import graphql from "babel-plugin-relay/macro";
import { VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useFragment } from "react-relay";
import { StatementSectionFragment$key } from "./__generated__/StatementSectionFragment.graphql";

export function StatementSection({
  fragment,
}: {
  fragment: StatementSectionFragment$key;
}) {
  const { statement } = useFragment(
    graphql`
      fragment StatementSectionFragment on DelegateStatement {
        statement
      }
    `,
    fragment
  );

  return (
    <VStack gap="4">
      <h2
        className={css`
          font-size: ${theme.fontSize["2xl"]};
          font-weight: bold;
        `}
      >
        Delegate statement
      </h2>

      <Markdown markdown={statement} />
    </VStack>
  );
}
