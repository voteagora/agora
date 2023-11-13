import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack, HStack } from "../../../components/VStack";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFListApplicationRowFragment$key } from "./__generated__/RetroPGFListApplicationRowFragment.graphql";
import { Link } from "../../../components/HammockRouter/Link";
import ProjectPlaceholder from "../ProjectPlaceholder.svg";

export function RetroPGFListApplicationRow({
  fragmentRef,
}: {
  fragmentRef: RetroPGFListApplicationRowFragment$key;
}) {
  const { project, OPAmount } = useFragment(
    graphql`
      fragment RetroPGFListApplicationRowFragment on ListContent {
        project {
          id
          displayName
          bio
          profile {
            profileImageUrl
          }
        }
        OPAmount
      }
    `,
    fragmentRef
  );

  return (
    <Link to={`/retropgf/3/application/${parseProjectId(project.id)}`}>
      <HStack
        gap="4"
        justifyContent="space-between"
        alignItems="center"
        className={css`
          border-bottom: 1px solid ${theme.colors.gray[300]};
          max-width: ${theme.maxWidth["6xl"]};
          padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            max-width: 100%;
          }
        `}
      >
        <HStack gap="4" alignItems="center" className={css``}>
          <img
            src={project.profile?.profileImageUrl ?? ProjectPlaceholder}
            alt={`${project.displayName} icon`}
            className={css`
              width: 40px;
              height: 40px;
              border-radius: 6px;
            `}
          />
          <VStack>
            <h3
              className={css`
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              {project.displayName}
            </h3>
            <p
              className={css`
                color: ${theme.colors.gray[700]};
                max-width: 300px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                @media (max-width: ${theme.maxWidth["lg"]}) {
                  display: none;
                }
              `}
            >
              {project.bio}
            </p>
          </VStack>
        </HStack>
        <VStack
          className={css`
            text-align: right;
          `}
        >
          <h2 className={css``}>{formatOPAmount(OPAmount)} OP</h2>
          <p
            className={css`
              color: ${theme.colors.gray[700]};
            `}
          >
            Allocated
          </p>
        </VStack>
      </HStack>
    </Link>
  );
}

function formatOPAmount(amount: number) {
  const numberFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  });

  const parts = numberFormat.formatToParts(amount);
  return parts
    .filter((part) => part.type !== "currency" && part.type !== "literal")
    .map((part) => part.value)
    .join("");
}

function parseProjectId(projectId: string) {
  return projectId.split("|")[1];
}
