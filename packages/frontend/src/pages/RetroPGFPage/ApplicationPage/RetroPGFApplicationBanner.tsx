import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { HStack, VStack } from "../../../components/VStack";
import { extractWebsiteName } from "../../../utils/retopgf";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { RetroPGFApplicationBannerFragment$key } from "./__generated__/RetroPGFApplicationBannerFragment.graphql";
import { NounResolvedLink } from "../../../components/NounResolvedLink";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import ProjectPlaceholder from "../ProjectPlaceholder.svg";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";
import { useSIWE } from "connectkit";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { useOpenDialog } from "../../../components/DialogProvider/DialogProvider";
import { RetroPGFStep } from "../BallotModal/RetroPGFAddToBallotModal";

export function RetroPGFApplicationBanner({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationBannerFragment$key;
}) {
  const project = useFragment(
    graphql`
      fragment RetroPGFApplicationBannerFragment on Project {
        id
        bio
        impactCategory
        displayName
        websiteUrl
        applicant {
          address {
            address
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
        }
        applicantType
        profile {
          profileImageUrl
          bannerImageUrl
        }
        includedInBallots
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...RetroPGFAddProjectToBallotModalContentFragment
      }
    `,
    fragmentRef
  );

  const openDialog = useOpenDialog();

  const { isSignedIn } = useSIWE();
  const { signature, doesBallotContainProject, projectAllocaiton } =
    useBallot();

  const projectToAdd = parseProjectId(project.id);

  return (
    <>
      <VStack
        alignItems="center"
        className={css`
          width: 100%;
          max-width: ${theme.maxWidth["6xl"]};
          padding-bottom: ${theme.spacing["8"]};
          padding-left: ${theme.spacing["4"]};
          padding-right: ${theme.spacing["4"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            flex-direction: column;
          }
        `}
      >
        <div
          className={css`
            box-sizing: border-box;
            border-radius: 12px;
            background: white;
            border-width: 1px;
            border-color: ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 400px;
            margin: 0 auto;
            padding-bottom: 80px;
            @media (max-width: ${theme.maxWidth["lg"]}) {
              height: 540px;
            }
          `}
        >
          <div
            className={css`
              position: absolute;
              top: 24px;
              left: 24px;
            `}
          >
            <HStack
              gap="2"
              className={css`
                flex-wrap: wrap;
              `}
            >
              {project.impactCategory.map((category) => (
                <CategoryListItem key={category} category={category} />
              ))}
            </HStack>
          </div>
          <div
            className={css`
              position: relative;
              overflow: hidden;
              height: 300px;
              width: 100%;
              border-radius: ${theme.spacing["4"]};
              border: 8px solid #fff;

              &::before {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background-image: url(${project.profile?.bannerImageUrl
                  ? project.profile.bannerImageUrl
                  : project.profile?.profileImageUrl ?? ""});
                filter: blur(
                  ${project.profile?.bannerImageUrl ? "0px" : "40px"}
                );
                background-size: cover;
                background-color: ${theme.colors.gray.fa};
                background-position: center;
              }
            `}
          ></div>
          <img
            src={project.profile?.profileImageUrl ?? ProjectPlaceholder}
            alt={`${project.displayName} icon`}
            className={css`
              height: 120px;
              width: 120px;
              position: absolute;
              bottom: calc(0% + 20px);
              left: 20px;
              z-index: 2;
              border: 6px solid #000;
              border-radius: 16px;
              border-color: #fff;
              background: #fff;
              box-shadow: ${theme.boxShadow.newDefault};
              @media (max-width: ${theme.maxWidth["lg"]}) {
                top: 200px;
                left: 50%;
                transform: translateX(-50%);
              }
            `}
          />
          <VStack
            className={css`
              position: absolute;
              bottom: 0;
              left: 144px;
              width: calc(100% - 144px);
              padding-left: ${theme.spacing["6"]};
              padding-bottom: ${theme.spacing["6"]};
              justify-content: space-between;
              @media (max-width: ${theme.maxWidth["lg"]}) {
                top: 316px;
                left: 0;
                width: 100%;
                flex-direction: column;
                align-items: center;
                padding: 0 ${theme.spacing["6"]};
              }
            `}
          >
            <HStack
              className={css`
                justify-content: space-between;
                align-items: center;
                @media (max-width: ${theme.maxWidth["lg"]}) {
                  flex-direction: column;
                }
              `}
            >
              <VStack
                className={css`
                  width: 100%;
                `}
              >
                <HStack
                  gap="3"
                  alignItems="center"
                  className={css`
                    @media (max-width: ${theme.maxWidth["lg"]}) {
                      flex-direction: column;
                      margin-top: ${theme.spacing["4"]};
                    }
                  `}
                >
                  <h3
                    className={css`
                      font-weight: ${theme.fontWeight["bold"]};
                      font-size: ${theme.fontSize["2xl"]};
                      @media (max-width: ${theme.maxWidth["lg"]}) {
                        text-align: center;
                      }
                    `}
                  >
                    {project.displayName}
                  </h3>
                  <HStack
                    gap="2"
                    className={css`
                      color: ${theme.colors.gray["700"]};
                      font-size: ${theme.fontSize["sm"]};
                      flex-wrap: wrap;
                      @media (max-width: ${theme.maxWidth["lg"]}) {
                        justify-content: center;
                        margin-bottom: ${theme.spacing["4"]};
                      }
                    `}
                  >
                    <p
                      className={css`
                        background-color: ${theme.colors.gray.fa};
                        padding: 0 ${theme.spacing[3]};
                        border-radius: 24px;
                      `}
                    >
                      {capitalizeFirstLetter(project.applicantType)}
                    </p>

                    <NounResolvedLink
                      resolvedName={project.applicant.address.resolvedName}
                      className={css`
                        background-color: ${theme.colors.gray.fa};
                        padding: 0 ${theme.spacing[3]};
                        border-radius: 24px;
                      `}
                    />

                    <div
                      className={css`
                        background-color: ${theme.colors.gray.fa};
                        padding: 0 ${theme.spacing[3]};
                        border-radius: 24px;
                      `}
                    >
                      <a
                        href={project.websiteUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <HStack>
                          {extractWebsiteName(project.websiteUrl)}
                          <ArrowTopRightOnSquareIcon
                            className={css`
                              width: 24px;
                              height: 24px;
                              color: ${theme.colors.gray["500"]};
                              display: block;
                              padding-left: 6px;
                            `}
                          />
                        </HStack>
                      </a>
                    </div>
                  </HStack>
                </HStack>

                <p
                  className={css`
                    font-family: "Inter";
                    font-style: normal;
                    font-weight: 500;
                    font-size: 16px;
                    line-height: 24px;
                    color: #4f4f4f;
                    @media (max-width: ${theme.maxWidth["lg"]}) {
                      text-align: center;
                    }
                  `}
                >
                  {project.bio}
                </p>
              </VStack>
              <HStack gap="2">
                <VStack
                  className={css`
                    margin-right: ${theme.spacing["4"]};
                    margin-top: ${theme.spacing["5"]};
                  `}
                >
                  <div
                    className={css`
                      font-size: ${theme.fontSize["sm"]};
                      color: ${theme.colors.gray["700"]};
                      text-wrap: nowrap;
                      text-align: right;
                    `}
                  >
                    Appears in
                  </div>
                  <div
                    className={css`
                      font-size: ${theme.fontSize["sm"]};
                      color: ${theme.colors.black};
                      text-wrap: nowrap;
                      text-align: right;
                    `}
                  >
                    {project.includedInBallots} ballots
                  </div>
                </VStack>
                {isSignedIn && !signature && (
                  <button
                    className={css`
                      ${buttonStyles};
                      margin-top: ${theme.spacing["4"]};
                      margin-right: ${theme.spacing["4"]};
                      white-space: nowrap;
                    `}
                    onClick={() =>
                      openDialog({
                        type: "RPGF",
                        params: {
                          step: RetroPGFStep.BALLOT,
                          projectFragmentRef: project,
                        },
                      })
                    }
                  >
                    {" "}
                    {doesBallotContainProject(projectToAdd)
                      ? formatNumber(Number(projectAllocaiton(projectToAdd))) +
                        " OP allocated"
                      : "Add to Ballot"}
                  </button>
                )}
              </HStack>
            </HStack>
          </VStack>
        </div>
      </VStack>
    </>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase();
}

function parseProjectId(projectId: string): string {
  return projectId.split("|")[1];
}

type CategoryListItemProps = {
  category: string;
};

const CategoryListItem = ({ category }: CategoryListItemProps) => {
  return (
    <div
      key={category}
      className={css`
        font-size: ${theme.fontSize.sm};
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        color: ${theme.colors.gray["700"]};
        line-height: ${theme.lineHeight.relaxed};
        padding: 0 ${theme.spacing["3"]};
        box-shadow: ${theme.boxShadow.newDefault};
        text-transform: capitalize;
        z-index: 1;
      `}
    >
      {formatCategory(category)}
    </div>
  );
};

function formatCategory(category: string) {
  switch (category) {
    case "OP_STACK":
      return "OP Stack";
    case "END_USER_EXPERIENCE_AND_ADOPTION":
      return "End User Experience & Adoption";
    default:
      return category
        .split("_")
        .map((it) => it.charAt(0).toUpperCase() + it.slice(1).toLowerCase())
        .join(" ");
  }
}
