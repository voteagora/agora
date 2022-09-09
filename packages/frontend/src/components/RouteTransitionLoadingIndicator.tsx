import { useIsNavigationPending } from "./HammockRouter/HammockRouter";
import React from "react";
import * as theme from "../theme";
import { css, keyframes } from "@emotion/css";
import { motion } from "framer-motion";

const shimmer = keyframes`
    from {
      opacity: 0.3;
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
        duration: 0.6,
        delay: isPending ? 0.3 : 0,
      }}
    >
      <div
        className={css`
          position: fixed;
          height: 2px;
          top: 0;
          left: 0;
          right: 0;
          background: #181a1d;

          animation: ${shimmer} 0.6s alternate-reverse infinite ease-out;
        `}
      />
    </motion.div>
  );
}
