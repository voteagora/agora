import { css } from "@emotion/css";
import React, { createContext, ReactNode, useContext } from "react";

import { Link } from "../../components/HammockRouter/Link";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";

export function RowValue({
  title,
  children,
  primary,
}: {
  title: ReactNode;
  children: ReactNode;
  primary?: boolean;
}) {
  const link = useContext(RowPathContext);

  const Wrapper = ({ children }: { children: ReactNode }) =>
    link ? <Link to={link}>{children}</Link> : <>{children}</>;

  return (
    <td
      className={css`
        padding: 0;
        ${primary &&
        css`
          width: 50%;
        `};

        ${!primary &&
        css`
          @media (max-width: ${theme.maxWidth["3xl"]}) {
            display: none;
          }
        `}
      `}
    >
      <Wrapper>
        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 100%;
          `}
          alignItems={primary ? "flex-start" : "flex-end"}
        >
          <div
            className={css`
              font-size: ${theme.fontSize["xs"]};
              color: ${theme.colors.gray[700]};
            `}
          >
            {title}
          </div>
          <div
            className={
              primary
                ? css`
                    width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  `
                : ""
            }
          >
            {children}
          </div>
        </VStack>
      </Wrapper>
    </td>
  );
}

export function Row({ children, path }: { children: ReactNode; path: string }) {
  return (
    <RowPathContext.Provider value={path}>
      <tr
        className={css`
          :not(:last-child) {
            border-bottom: 1px solid ${theme.colors.gray[300]};
          }

          transition: background-color 0.1s ease-in-out;

          :hover {
            background: ${theme.colors.gray["fa"]};
          }

          @media (max-width: ${theme.maxWidth.lg}) {
            max-width: 100%;
          }
        `}
      >
        {children}
      </tr>
    </RowPathContext.Provider>
  );
}

const RowPathContext = createContext<string | null>(null);
