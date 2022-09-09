import { css, keyframes } from "@emotion/css";
import logo from "../logo.svg";
import * as theme from "../theme";
import { VStack } from "./VStack";

const shimmer = keyframes`
    from {
      opacity: 0.6;
    }
  
  to {
    opacity: 1;
  }
`;

export function FullPageLoadingIndicator() {
  return (
    <VStack
      justifyContent="center"
      className={css`
        min-height: 100vh;
        animation: ${shimmer} 0.5s alternate-reverse infinite ease-in-out;
      `}
    >
      <img
        className={css`
          height: ${theme.spacing["12"]};
          width: ${theme.spacing["12"]};
        `}
        src={logo}
      />
    </VStack>
  );
}
