import { useIsNavigationPending } from "./HammockRouter/HammockRouter";
import React from "react";
import * as theme from "../theme";
import { css, keyframes } from "@emotion/css";
import { motion } from "framer-motion";

const shimmer = keyframes`
    from {
      opacity: 0.5;
    }
  
  to {
    opacity: 0.7;
  }
`;

export function RouteTransitionLoadingIndicator() {
  const isPending = useIsNavigationPending();

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: isPending ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        delay: isPending ? 0.3 : 0,
      }}
    >
      <div
        className={css`
          position: fixed;
          height: ${theme.spacing["2"]};
          top: 0;
          left: 0;
          right: 0;
          background: #a0aec0;

          animation: ${shimmer} 0.3s alternate-reverse infinite ease-out;
        `}
      />
    </motion.div>
  );
}
