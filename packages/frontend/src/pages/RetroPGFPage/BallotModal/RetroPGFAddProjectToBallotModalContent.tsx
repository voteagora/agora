import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { Suspense, useState } from "react";
import { HStack, VStack } from "../../../components/VStack";
import { Ballot } from "../RetroPGFVoterStore/RetroPGFVoterStoreContext";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";
import { RetroPGFModalApplicationRow } from "./RetroPGFModalApplicationRow";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFAddProjectToBallotModalContentFragment$key } from "./__generated__/RetroPGFAddProjectToBallotModalContentFragment.graphql";

export function RetroPGFAddProjectToBallotModalContent({
  projectFragment,
  goToNextStep,
  closeDialog,
}: {
  projectFragment: RetroPGFAddProjectToBallotModalContentFragment$key;
  goToNextStep: () => void;
  closeDialog: () => void;
}) {
  const project = useFragment(
    graphql`
      fragment RetroPGFAddProjectToBallotModalContentFragment on Project {
        id
        ...RetroPGFModalApplicationRowFragment
      }
    `,
    projectFragment
  );

  const {
    saveProjects,
    doesBallotContainProject,
    ballotValue,
    projectAllocaiton,
  } = useBallot();

  const [projectToAdd, setProjectToAdd] = useState<Ballot>([
    {
      projectId: parseProjectId(project.id),
      amount: projectAllocaiton(parseProjectId(project.id)) || "0",
    },
  ]);

  const allocatedOPTokens =
    ballotValue +
    Number(projectToAdd[0].amount) -
    Number(projectAllocaiton(projectToAdd[0].projectId));

  const updateProject = (projectId: string, amount: string) => {
    setProjectToAdd(
      projectToAdd.map((project) =>
        project.projectId === projectId ? { ...project, amount } : project
      )
    );
  };

  const removeProject = () => {
    saveProjects([], [projectToAdd[0].projectId]);
    goToNextStep();
  };

  const saveBallot = () => {
    saveProjects(projectToAdd, []);
    goToNextStep();
  };

  return (
    <VStack
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <VStack
        className={css`
          background: white;
          border-radius: 12px;
          width: ${theme.maxWidth["6xl"]};
          box-shadow: ${theme.boxShadow.newDefault};
          & > div:last-child {
            border-bottom: none;
          }
        `}
      >
        <VStack>
          {doesBallotContainProject(parseProjectId(project.id)) ? (
            <div
              className={css`
                padding: ${theme.spacing["6"]} ${theme.spacing["6"]}
                  ${theme.spacing["1"]} ${theme.spacing["6"]};
                font-weight: ${theme.fontWeight["semibold"]};
              `}
            >
              Already in your ballot
            </div>
          ) : (
            <div
              className={css`
                padding: ${theme.spacing["6"]} ${theme.spacing["6"]}
                  ${theme.spacing["1"]} ${theme.spacing["6"]};
                font-weight: ${theme.fontWeight["semibold"]};
              `}
            >
              Add to your ballot
            </div>
          )}
          <VStack
            className={css`
              max-height: ${theme.spacing[72]};
              max-height: ${theme.maxWidth["xl"]};
              overflow-y: auto;
            `}
          >
            {projectToAdd.map(({ projectId, amount }) => (
              <Suspense key={projectId}>
                <RetroPGFModalApplicationRow
                  projectId={projectId}
                  OPAmount={Number(amount)}
                  updateProject={updateProject}
                  removeProject={removeProject}
                  fragmentRef={project}
                  canRemove={false}
                />
              </Suspense>
            ))}
          </VStack>
        </VStack>
        <HStack
          justifyContent="space-between"
          className={css`
            border-top: 1px solid ${theme.colors.gray[200]};
            padding: ${theme.spacing["8"]};
          `}
        >
          <VStack>
            <p
              className={css`
                font-family: "Inter";
                font-style: normal;
                font-weight: 600;
                font-size: 12px;
                line-height: 16px;
                color: #4f4f4f;
              `}
            >
              Total allocated
            </p>
            <HStack>
              <h3
                className={css`
                  font-weight: ${theme.fontWeight["medium"]};
                  font-size: 16px;
                  line-height: 24px;
                  color: ${allocatedOPTokens > 30_000_000
                    ? theme.colors.red[500]
                    : theme.colors.black};
                `}
              >
                {`${formatNumber(allocatedOPTokens)} OP`}
              </h3>
              <h3
                className={css`
                  font-weight: ${theme.fontWeight["medium"]};
                  font-size: 16px;
                  line-height: 24px;
                  color: ${theme.colors.gray[500]};
                `}
              >
                {`/ ${formatNumber(30_000_000)} OP`}
              </h3>
            </HStack>
          </VStack>
          <HStack gap="4">
            {doesBallotContainProject(parseProjectId(project.id)) && (
              <button
                className={css`
                  margin-right: ${theme.spacing["8"]};
                `}
                onClick={removeProject}
              >
                Remove from ballot
              </button>
            )}
            <button
              className={css`
                ${buttonStyles};
                padding: ${theme.spacing["3"]} ${theme.spacing["8"]};
              `}
              onClick={() => {
                saveBallot();
                goToNextStep();
              }}
            >
              {doesBallotContainProject(parseProjectId(project.id))
                ? "Save"
                : "Add to ballot"}
            </button>
          </HStack>
        </HStack>
      </VStack>
    </VStack>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function parseProjectId(projectId: string): string {
  return projectId.split("|")[1];
}
