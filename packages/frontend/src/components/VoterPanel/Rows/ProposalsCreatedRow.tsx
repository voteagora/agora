import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PanelRow } from "./PanelRow";
import { ProposalsCreatedRowFragment$key } from "./__generated__/ProposalsCreatedRowFragment.graphql";
import React, { useState } from "react";
import { VStack, HStack } from "../../VStack";
import { ExpandItemsArrow } from "./DelegateFromListRow";
import { css } from "@emotion/css";
import { Link } from "../../HammockRouter/Link";
import * as theme from "../../../theme";
export function ProposalsCreatedRow({
  fragment,
}: {
  fragment: ProposalsCreatedRowFragment$key;
}) {
  const { delegateMetrics, proposed } = useFragment(
    graphql`
      fragment ProposalsCreatedRowFragment on Delegate {
        delegateMetrics {
          proposalsCreated
        }
        proposed {
          number
          title
        }
      }
    `,
    fragment
  );

  const [isExpanded, setIsExpanded] = useState(false);

  console.log(proposed);
  return (
    <VStack gap="1">
      <PanelRow
        title="Proposals created"
        detail={
          <div onClick={() => setIsExpanded((lastValue) => !lastValue)}>
            <HStack alignItems="center" gap="1">
              {delegateMetrics.proposalsCreated ? (
                <HStack
                  gap="1"
                  alignItems="center"
                  className={css`
                    cursor: pointer;
                    user-select: none;
                  `}
                >
                  <div>{delegateMetrics.proposalsCreated}</div>{" "}
                  <ExpandItemsArrow isExpanded={isExpanded} />
                </HStack>
              ) : (
                <div>N/A</div>
              )}
            </HStack>
          </div>
        }
      />
      {isExpanded && (
        <VStack gap="1">
          {proposed.map((proposal) => {
            return (
              <Link to={`/proposals/${proposal.number}`}>
                <HStack justifyContent="space-between">
                  <div
                    className={css`
                      color: ${theme.colors.gray[700]};
                    `}
                  >
                    Prop {proposal.number}
                  </div>
                  <div
                    className={css`
                      overflow: hidden;
                      white-space: nowrap;
                      text-overflow: ellipsis;
                      width: ${theme.spacing["40"]};
                      text-align: right;
                    `}
                  >
                    {proposal.title}
                  </div>
                </HStack>
              </Link>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
