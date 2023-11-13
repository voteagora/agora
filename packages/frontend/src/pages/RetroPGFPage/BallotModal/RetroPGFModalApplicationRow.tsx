import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack, HStack } from "../../../components/VStack";
import { icons } from "../../../icons/icons";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ChangeEvent, useState } from "react";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { RetroPGFModalApplicationRowFragment$key } from "./__generated__/RetroPGFModalApplicationRowFragment.graphql";
import ProjectPlaceholder from "../ProjectPlaceholder.svg";

export function RetroPGFModalApplicationRow({
  projectId,
  OPAmount,
  canRemove,
  removeProject,
  updateProject,
  fragmentRef,
}: {
  projectId: string;
  OPAmount: number;
  canRemove: boolean;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, amount: string) => void;
  fragmentRef: RetroPGFModalApplicationRowFragment$key;
}) {
  const project = useFragment(
    graphql`
      fragment RetroPGFModalApplicationRowFragment on Project {
        displayName
        bio
        profile {
          profileImageUrl
        }
      }
    `,
    fragmentRef
  );

  const { projectAllocaiton } = useBallot();

  const ballotAllocation = projectAllocaiton(projectId);

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
          <HStack gap="2">
            {ballotAllocation && (
              <VStack
                className={css`
                  margin-right: ${theme.spacing["4"]};
                  margin-top: ${theme.spacing["2"]};
                `}
              >
                <p
                  className={css`
                    font-size: ${theme.fontSize.sm};
                    color: ${theme.colors.gray[700]};
                  `}
                >
                  In your ballot
                </p>
                <p
                  className={css`
                    font-weight: ${theme.fontWeight.medium};
                    font-size: ${theme.fontSize.sm};
                  `}
                >
                  {`${formatNumber(Number(ballotAllocation))} OP`}
                </p>
              </VStack>
            )}
            <HStack
              className={css`
                border: 1px solid ${theme.colors.gray.eb};
                border-radius: 8px;
                color: "black"
                background-color: "white";
              `}
            >
              <NumberInput
                projectId={projectId}
                OPAmount={OPAmount}
                updateProject={updateProject}
              />
              {canRemove && (
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
                  <img
                    className={css`
                      width: ${theme.spacing["4"]};
                    `}
                    src={icons["close"]}
                    alt={"remove entry"}
                  />
                </button>
              )}
            </HStack>
          </HStack>
        </HStack>
      )}
    </>
  );
}

function NumberInput({
  projectId,
  OPAmount,
  updateProject,
}: {
  projectId: string;
  OPAmount: number;
  updateProject: (projectId: string, amount: string) => void;
}) {
  const [displayValue, setDisplayValue] = useState(formatNumber(OPAmount));

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

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}
