import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack, HStack } from "../../../components/VStack";
import { icons } from "../../../icons/icons";
import { useLazyLoadQuery } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFApplicationRowQuery } from "./__generated__/RetroPGFApplicationRowQuery.graphql";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { ChangeEvent, useState } from "react";
import ProjectPlaceholder from "../ProjectPlaceholder.svg";
import { Link } from "../../../components/HammockRouter/Link";

export function RetroPGFApplicationRow({
  projectId,
  OPAmount,
}: {
  projectId: string;
  OPAmount: number;
}) {
  const {
    retroPGF: { project },
  } = useLazyLoadQuery<RetroPGFApplicationRowQuery>(
    graphql`
      query RetroPGFApplicationRowQuery($projectId: ID!) {
        retroPGF {
          project(id: $projectId) {
            displayName
            bio
            profile {
              profileImageUrl
            }
          }
        }
      }
    `,
    { projectId }
  );

  const { removeProject, signature } = useBallot();

  return (
    <>
      {project && (
        <HStack
          gap="4"
          justifyContent="space-between"
          alignItems="center"
          className={css`
            max-width: ${theme.maxWidth["6xl"]};
            padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
          `}
        >
          <Link to={`/retropgf/3/application/${projectId}`}>
            <HStack gap="4" alignItems="center">
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
                    max-width: ${theme.maxWidth["md"]};
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                  `}
                >
                  {project.bio}
                </p>
              </VStack>
            </HStack>
          </Link>
          <HStack
            className={css`
                border: 1px solid ${theme.colors.gray.eb};
                border-radius: 8px;
                color: "black"
                background-color: "white";
              `}
          >
            <RPGFNumberInput projectId={projectId} OPAmount={OPAmount} />
            {!signature && (
              <button
                className={css`
                  background: none;
                  padding: ${theme.spacing["3"]};
                  border-left: 1px solid ${theme.colors.gray.eb};
                `}
                onClick={() => {
                  removeProject(projectId);
                }}
              >
                <img src={icons["bin"]} alt={"remove entry"} />
              </button>
            )}
          </HStack>
        </HStack>
      )}
    </>
  );
}

export function RPGFNumberInput({
  projectId,
  OPAmount,
}: {
  projectId: string;
  OPAmount: number;
}) {
  const [displayValue, setDisplayValue] = useState(formatNumber(OPAmount));

  const { updateProject, signature } = useBallot();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFloat(event.target.value.replace(/,/g, ""));
    if (!isNaN(numericValue) && numericValue >= 0) {
      if (numericValue <= 5_000_000) {
        updateProject(projectId, numericValue.toString());
        setDisplayValue(formatNumber(numericValue));
      }
    } else {
      setDisplayValue("0");
      updateProject(projectId, "0");
    }
  };

  function formatNumber(value: number) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
  }

  return (
    <div
      className={css`
        padding: ${theme.spacing["4"]} ${theme.spacing["2"]}
          ${theme.spacing["4"]} ${theme.spacing["4"]};
      `}
    >
      <input
        type="text"
        className={css`
          width: ${theme.spacing["24"]};
          :focus {
            outline: none;
          }
        `}
        disabled={!!signature}
        value={displayValue}
        onChange={handleInputChange}
      />
      <label
        className={css`
          margin-right: ${theme.spacing["2"]};
        `}
      >
        OP
      </label>
    </div>
  );
}
