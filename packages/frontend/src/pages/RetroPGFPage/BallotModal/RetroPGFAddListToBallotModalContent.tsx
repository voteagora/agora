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
import { RetroPGFAddListToBallotModalContentFragment$key } from "./__generated__/RetroPGFAddListToBallotModalContentFragment.graphql";
import { useAccount } from "wagmi";

export function RetroPGFAddListToBallotModalContent({
  listFragment,
  goToNextStep,
  closeDialog,
}: {
  listFragment: RetroPGFAddListToBallotModalContentFragment$key;
  goToNextStep: () => void;
  closeDialog: () => void;
}) {
  const { listContent, id, listName } = useFragment(
    graphql`
      fragment RetroPGFAddListToBallotModalContentFragment on List {
        id
        listName
        listContent {
          project {
            id
            ...RetroPGFModalApplicationRowFragment
          }
          OPAmount
        }
      }
    `,
    listFragment
  );

  const { address } = useAccount();

  const projectsToAdd = listContent.map((content) => {
    return {
      projectId: parseListId(content.project.id),
      amount: content.OPAmount.toString(),
    };
  });

  const {
    saveProjects,
    doesBallotContainProject,
    ballotValue,
    projectAllocaiton,
  } = useBallot();

  const [alreadyInTheBallot, setAlreadyInYourBallot] = useState<Ballot>(
    projectsToAdd.filter(({ projectId }) => doesBallotContainProject(projectId))
  );

  const [projects, setProjects] = useState<Ballot>(
    projectsToAdd.filter(
      ({ projectId }) => !doesBallotContainProject(projectId)
    )
  );

  const allocatedOPTokens =
    ballotValue +
    projects.reduce((total, { amount }) => total + Number(amount), 0) +
    alreadyInTheBallot.reduce(
      (total, { amount, projectId }) =>
        total + Number(amount) - Number(projectAllocaiton(projectId)),
      0
    );

  const updateProject = (projectId: string, amount: string) => {
    setProjects(
      projects.map((project) =>
        project.projectId === projectId ? { ...project, amount } : project
      )
    );
    setAlreadyInYourBallot(
      alreadyInTheBallot.map((project) =>
        project.projectId === projectId ? { ...project, amount } : project
      )
    );
  };

  const removeProject = (projectId: string) => {
    const newProjects = projects.filter(
      ({ projectId: id }) => id !== projectId
    );
    setProjects(newProjects);

    const newAlreadyInTheBallot = alreadyInTheBallot.filter(
      ({ projectId: id }) => id !== projectId
    );
    if (alreadyInTheBallot.some(({ projectId: id }) => id === projectId)) {
      setAlreadyInYourBallot(newAlreadyInTheBallot);
    }

    if (newProjects.length === 0 && newAlreadyInTheBallot.length === 0) {
      closeDialog();
    }
  };

  const saveBallot = () => {
    saveProjects([...projects, ...alreadyInTheBallot], []);
    goToNextStep();

    (window as any).plausible("RetroPGFAddListToBallot", {
      props: {
        listName,
        listId: id,
        badgeholder: address,
      },
    });
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
        {projects.length > 0 && (
          <VStack>
            <div
              className={css`
                padding: ${theme.spacing["6"]} ${theme.spacing["6"]}
                  ${theme.spacing["1"]} ${theme.spacing["6"]};
                font-weight: ${theme.fontWeight["semibold"]};
              `}
            >
              Add to your ballot
            </div>
            <VStack
              className={css`
                max-height: ${alreadyInTheBallot.length > 0
                  ? theme.spacing[72]
                  : theme.maxWidth["xl"]};
                position: relative;
                top: 1px;
                border-bottom: 1px solid ${theme.colors.gray[300]};
                border-radius: 12px 12px 0 0;
                overflow-y: auto;
              `}
            >
              {projects.map(({ projectId, amount }) => (
                <Suspense key={projectId}>
                  <RetroPGFModalApplicationRow
                    projectId={projectId}
                    OPAmount={Number(amount)}
                    updateProject={updateProject}
                    removeProject={removeProject}
                    fragmentRef={
                      listContent.find(({ project }) => {
                        return parseListId(project.id) === projectId;
                      })!.project
                    }
                    canRemove={true}
                  />
                </Suspense>
              ))}
            </VStack>
          </VStack>
        )}
        {alreadyInTheBallot.length > 0 && (
          <VStack>
            <VStack
              className={css`
                padding: ${theme.spacing["6"]} ${theme.spacing["6"]}
                  ${theme.spacing["1"]} ${theme.spacing["6"]};
              `}
            >
              <div
                className={css`
                  font-weight: ${theme.fontWeight["semibold"]};
                `}
              >
                Already in your ballot
              </div>
              <div
                className={css`
                  color: ${theme.colors.gray[700]};
                `}
              >
                You can modify allocation based on the suggested amount, or
                remove it if you wish to keep things as is
              </div>
            </VStack>
            <VStack
              className={css`
                max-height: ${projects.length > 0
                  ? theme.spacing[72]
                  : theme.maxWidth["xl"]};
                overflow-y: auto;
              `}
            >
              {alreadyInTheBallot.map(({ projectId, amount }) => (
                <Suspense key={projectId}>
                  <RetroPGFModalApplicationRow
                    projectId={projectId}
                    OPAmount={Number(amount)}
                    updateProject={updateProject}
                    removeProject={removeProject}
                    fragmentRef={
                      listContent.find(({ project }) => {
                        return parseListId(project.id) === projectId;
                      })!.project
                    }
                    canRemove={true}
                  />
                </Suspense>
              ))}
            </VStack>
          </VStack>
        )}
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
            <button
              className={css`
                margin-right: ${theme.spacing["8"]};
              `}
              onClick={closeDialog}
            >
              Cancel
            </button>
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
              Add to ballot
            </button>
          </HStack>
        </HStack>
      </VStack>
    </VStack>
  );
}

function parseListId(listId: string): string {
  return listId.split("|")[1];
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}
