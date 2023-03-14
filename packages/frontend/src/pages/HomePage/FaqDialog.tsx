import * as theme from "../../theme";
import { VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";

export function FaqDialog() {
  return (
    <VStack
      alignItems="center"
      className={css`
        padding: ${theme.spacing["8"]};
      `}
    >
      <Dialog.Panel
        as={motion.div}
        initial={{
          scale: 0.9,
          translateY: theme.spacing["8"],
        }}
        animate={{ translateY: 0, scale: 1 }}
        className={css`
          width: 100%;
          max-width: ${theme.maxWidth.lg};
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["6"]};
        `}
      >
        <VStack>
          <h2
            className={css`
              font-size: ${theme.fontSize["xl"]};
              font-weight: ${theme.fontWeight.bold};
              margin-bottom: ${theme.spacing["2"]};
            `}
          >
            Delegation FAQ
          </h2>
          <FaqSection
            question={"What is delegation?"}
            answer={
              "Participating in governance of the Optimism Token House will require a serious time commitment. For this reason, we will strongly encourage people to delegate the voting power of their tokens to a community member who has explicitly volunteered to play an active role in Token House governance. These volunteers are called delegates. When you delegate your voting power, you retain 100% ownership of your tokens, and can use them however you want. You may change your delegate selection at any time."
            }
          />
          <FaqSection
            question={"What does delegation mean for my tokens"}
            answer={
              "When you delegate the voting power of your tokens, you retain 100% ownership of the token itself. There are no changes to the way you use or hold the token. A healthy governance system is good for Optimism and for all OP holders. Choosing a good delegate is in each OP token holder's best interest."
            }
          />
          <FaqSection
            question={"Who should I choose as a delegate?"}
            answer={
              "  You can choose anyone who you believe will participate in Optimism governance and can represent what you want this ecosystem to become. You can see each delegate's statement of interest by clicking on their tile. You may also delegate to any address using the input field to the top-left."
            }
          />
          <FaqSection
            question={"How do I change this later?"}
            answer={
              "Delegation is always in your control. You can return to this page at any time to change your delegate selection, or to re-delegate voting power to yourself."
            }
          />
        </VStack>
      </Dialog.Panel>
    </VStack>
  );
}

function FaqSection({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <VStack
      gap="1"
      className={css`
        margin: ${theme.spacing["2"]} 0;
      `}
    >
      <h2
        className={css`
          font-weight: ${theme.fontWeight["medium"]};
        `}
      >
        {question}
      </h2>
      <div
        className={css`
          color: ${theme.colors.gray["700"]};
        `}
      >
        {answer}
      </div>
    </VStack>
  );
}
