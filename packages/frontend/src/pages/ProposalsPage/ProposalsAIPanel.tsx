import { useFragment } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { ChatCompletionRequestMessage } from "openai-streams";
import { VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { ProposalsAIPanelFragment$key } from "./__generated__/ProposalsAIPanelFragment.graphql";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { ProposalsAIPanelQueryFragment$key } from "./__generated__/ProposalsAIPanelQueryFragment.graphql";
import { useGenerateChatGpt } from "../../hooks/useGenerateChatGpt";

export const generateUserView = (
  statement: {
    readonly statement: string;
    readonly topIssues: readonly {
      readonly type: string;
      readonly value: string;
    }[];
  } | null
) =>
  `This is my statement: ${statement?.statement}\n\n${
    statement?.topIssues?.length !== 0 &&
    statement?.topIssues
      .map(
        ({ type, value }) =>
          `On the topic of ${type}, my view is: ${value.trim()}`
      )
      .join(".\n")
  }`;

export function ProposalsAIPanel({
  delegateFragmentRef,
  proposalFragmentRef,
}: {
  delegateFragmentRef: ProposalsAIPanelQueryFragment$key;
  proposalFragmentRef: ProposalsAIPanelFragment$key;
}) {
  const { generateChatGpt, text, isLoading } = useGenerateChatGpt();

  const { delegate } = useFragment(
    graphql`
      fragment ProposalsAIPanelQueryFragment on Query
      @argumentDefinitions(
        address: { type: "String!" }
        skipAddress: { type: "Boolean!" }
      ) {
        delegate(addressOrEnsName: $address) @skip(if: $skipAddress) {
          statement {
            statement
            # eslint-disable-next-line relay/unused-fields
            topIssues {
              type
              value
            }
          }
        }
      }
    `,
    delegateFragmentRef
  );

  const proposal = useFragment(
    graphql`
      fragment ProposalsAIPanelFragment on Proposal {
        description
      }
    `,
    proposalFragmentRef
  );

  const statement = delegate?.statement;

  const userView = statement ? generateUserView(statement) : "";

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: `You are a governance assistant that helps voting on DAO proposals. Impersonate the user and reply with a reason to vote. Do not exceed 400 characters. Break lines between paragraphs and use bullet lists. Start with "The aim of this proposal is to".`,
    },
    {
      role: "user",
      content: userView,
    },
    {
      role: "user",
      content: `Based on how my statement and views align or are in conflict with the proposal, explain why I should vote for, against or abstain. Here is the proposal:\n\n${proposal.description}`,
    },
  ];

  // TODO: Consider using local storage to save the report
  // const [report, setReport] = useState<string>(
  //   localStorage.getItem(`${address}-${proposal.number}-report`)!
  // )

  // useEffect(() => {
  //   if (address && proposal.number) {
  //     localStorage.setItem(`${address}-${proposal.number}-report`, report)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [report])

  return userView ? (
    <VStack
      gap="4"
      className={css`
        position: relative;

        height: 100%;
        flex-shrink: 0;
        overflow-y: scroll;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        padding-bottom: ${theme.spacing["4"]};
        font-size: 0.75rem;

        @media (max-width: ${theme.maxWidth["2xl"]}) {
          display: none;
        }
      `}
    >
      <VStack
        className={css`
          border: 1px solid #e0e0e0;
          border-radius: ${theme.borderRadius.lg};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            margin-top: ${theme.spacing["1"]};
          }
        `}
      >
        <textarea
          readOnly
          className={css`
            padding: ${theme.spacing["4"]};
            resize: none;
            border-radius: ${theme.borderRadius.lg};
            :focus {
              outline: 0;
            }
          `}
          value={text ?? undefined}
          placeholder="The aim of this proposal is to ..."
        />
        <button
          className={
            buttonStyles +
            " " +
            css`
              height: ${theme.spacing["8"]};
              border-radius: ${theme.borderRadius.md};
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: small;
              margin-left: ${theme.spacing["3"]};
              margin-right: ${theme.spacing["3"]};
              margin-top: ${theme.spacing["1"]};
              margin-bottom: ${theme.spacing["3"]};
            `
          }
          onClick={async () => statement && (await generateChatGpt(messages))}
          disabled={isLoading}
        >
          Generate AI Report ✨
        </button>
      </VStack>
    </VStack>
  ) : null;
}
