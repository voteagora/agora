import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { NounResolvedLink } from "../../../components/NounResolvedLink";
import { NounResolvedLinkFragment$key } from "../../../components/__generated__/NounResolvedLinkFragment.graphql";
import { css } from "@emotion/css";

export function ProposalRow({
  onClick,
  statusColor,
  status,
  selected,
  typeTitle,
  title,
  proposerResolvedName,
}: {
  onClick: () => void;
  selected: boolean;
  typeTitle: string;
  title: string;
  proposerResolvedName?: NounResolvedLinkFragment$key | undefined;
  status: string;
  statusColor: string;
}) {
  return (
    <div onClick={onClick}>
      <VStack
        gap="2"
        className={css`
          cursor: pointer;
          transition: 200ms all;
          border-radius: ${theme.borderRadius.lg};
          ${selected &&
          css`
            background-color: ${theme.colors.gray.fa};
          `};
          padding-top: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["4"]};
          padding-left: ${theme.spacing["3"]};
          padding-right: ${theme.spacing["3"]};

          &:hover {
            background-color: ${theme.colors.gray.fa};
          }
        `}
      >
        <div
          className={css`
            color: ${theme.colors.gray["4f"]};
            font-weight: ${theme.fontWeight.medium};
            font-size: ${theme.fontSize.xs};
            line-height: ${theme.lineHeight.none};
          `}
        >
          {typeTitle}
        </div>
        <div
          className={css`
            color: ${theme.colors.black};
            font-size: ${theme.fontSize.sm};
            font-weight: ${theme.fontWeight.medium};
            line-height: ${theme.lineHeight["5"]};
            cursor: pointer;
          `}
        >
          {title}
        </div>
        <HStack
          className={css`
            font-weight: ${theme.fontWeight.medium};
            font-size: ${theme.fontSize.xs};
            line-height: ${theme.lineHeight.none};
          `}
        >
          {proposerResolvedName !== undefined && (
            <>
              <div
                className={css`
                  color: ${theme.colors.gray["4f"]};
                `}
              >
                by <NounResolvedLink resolvedName={proposerResolvedName} />
              </div>
              <div
                className={css`
                  color: ${theme.colors.gray.af};
                `}
              >
                &nbsp;•&nbsp;
              </div>
            </>
          )}
          <div
            className={css`
              color: ${statusColor};
              text-transform: capitalize;
            `}
          >
            {status}
          </div>
        </HStack>
      </VStack>
    </div>
  );
}
