import { useFragment, useLazyLoadQuery } from "react-relay/hooks"
import graphql from "babel-plugin-relay/macro"
import { useAccount } from "wagmi"
import { ProposalsAIPanelQuery } from "./__generated__/ProposalsAIPanelQuery.graphql"
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  OpenAI
} from "openai-streams"
import { Dispatch, SetStateAction, useState } from "react"
import { yieldStream } from "yield-stream"
import { VStack } from "../../components/VStack"
import { css } from "@emotion/css"
import * as theme from "../../theme"
import { ProposalsAIPanelFragment$key } from "./__generated__/ProposalsAIPanelFragment.graphql"
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage"

const apiKey = process.env.PUBLIC_OPENAI_KEY

export const generateUserView = (
  statement: {
    readonly statement: string
    readonly topIssues: readonly {
      readonly type: string
      readonly value: string
    }[]
  } | null
) => `This is my statement: ${statement?.statement}

${
  statement?.topIssues?.length !== 0 &&
  statement?.topIssues
    .map(
      ({ type, value }) =>
        `On the topic of ${type}, my view is: ${value.trim()}`
    )
    .join(".\n")
}`

export const generateChatGpt = async (
  messages: ChatCompletionRequestMessage[],
  setText: Dispatch<SetStateAction<string>>,
  setIsPending: Dispatch<SetStateAction<boolean>>
) => {
  setIsPending(true)
  setText("")

  try {
    const stream = await OpenAI(
      "chat",
      {
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        messages
      },
      { apiKey: apiKey }
    )

    const abortController = new AbortController()
    const DECODER = new TextDecoder()

    for await (const chunk of yieldStream(stream, abortController)) {
      if (abortController.signal.aborted) break

      try {
        const decoded: ChatCompletionResponseMessage = JSON.parse(
          DECODER.decode(chunk)
        )

        if (decoded.content === undefined)
          throw new Error(
            "No choices in response. Decoded response: " +
              JSON.stringify(decoded)
          )

        setText((text) => text + decoded.content)
      } catch (err) {
        console.error(err)
      }
    }
  } catch (err) {
    console.error(err)
  }

  setIsPending(false)
}

export function ProposalsAIPanel({
  fragmentRef
}: {
  fragmentRef: ProposalsAIPanelFragment$key
}) {
  const [report, setReport] = useState("")
  const [isPending, setIsPending] = useState(false)
  const { address } = useAccount()

  const query = useLazyLoadQuery<ProposalsAIPanelQuery>(
    graphql`
      query ProposalsAIPanelQuery($addressOrEnsName: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $addressOrEnsName) @skip(if: $skip) {
          statement {
            statement
            topIssues {
              type
              value
            }
          }
        }
      }
    `,
    {
      addressOrEnsName: address ?? "",
      skip: !address
    }
  )

  const proposal = useFragment(
    graphql`
      fragment ProposalsAIPanelFragment on Proposal {
        description
      }
    `,
    fragmentRef
  )

  const statement = query?.delegate?.statement

  const userView = statement ? generateUserView(statement) : ""

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: `You are a governance assistant that helps voting on DAO proposals. Impersonate the user and reply with a reason to vote. Do not exceed 600 characters. Break lines between paragraphs and use bullet lists. Start with "The aim of this proposal is to".`
    },
    {
      role: "user",
      content: userView
    },
    {
      role: "user",
      content: `Based on how my statement and views align or are in conflict with the proposal, explain why I should vote for, against or abstain. Here is the proposal:\n\n${proposal.description}`
    }
  ]

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
          value={report}
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
          onClick={async () =>
            statement &&
            (await generateChatGpt(messages, setReport, setIsPending))
          }
          disabled={!statement || isPending}
        >
          Generate AI Report ✨
        </button>
      </VStack>
    </VStack>
  ) : null
}
