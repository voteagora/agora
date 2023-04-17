import * as Sentry from "@sentry/react";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  OpenAI,
} from "openai-streams";
import { useState } from "react";
import { yieldStream } from "yield-stream";

const DECODER = new TextDecoder();

export const useGenerateChatGpt = () => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateChatGpt = async (
    messages: ChatCompletionRequestMessage[],
    setChatGptText = setText
  ) => {
    setIsLoading(true);
    setChatGptText("");
    try {
      const stream = await OpenAI(
        "chat",
        {
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          messages,
        },
        { apiKey: process.env.REACT_APP_OPENAI_KEY }
      );

      for await (const chunk of yieldStream(stream)) {
        try {
          const decoded: ChatCompletionResponseMessage = JSON.parse(
            DECODER.decode(chunk)
          );

          if (decoded.content === undefined) {
            throw new Error(
              "No choices in response. Decoded response: " +
                JSON.stringify(decoded)
            );
          }

          setChatGptText((text) => text + decoded.content);
        } catch {}
      }
    } catch (e) {
      const id = Sentry.captureException(e);
      console.error(e, { id });
    }

    setIsLoading(false);
  };

  return { text, isLoading, generateChatGpt };
};
