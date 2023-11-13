import { RetroPGFAddListToBallotModalContent } from "./RetroPGFAddListToBallotModalContent";
import { RetroPGFAddListToBallotModalContentFragment$key } from "./__generated__/RetroPGFAddListToBallotModalContentFragment.graphql";
import { RetroPGFAddProjectToBallotModalContent } from "./RetroPGFAddProjectToBallotModalContent";
import { RetroPGFAddProjectToBallotModalContentFragment$key } from "./__generated__/RetroPGFAddProjectToBallotModalContentFragment.graphql";

export function RetroPGFBallotModalContent({
  listFragmentRef,
  projectFragmentRef,
  goToNextStep,
  closeDialog,
}: {
  listFragmentRef?: RetroPGFAddListToBallotModalContentFragment$key;
  projectFragmentRef?: RetroPGFAddProjectToBallotModalContentFragment$key;
  goToNextStep: () => void;
  closeDialog: () => void;
}) {
  if (listFragmentRef) {
    return (
      <RetroPGFAddListToBallotModalContent
        listFragment={listFragmentRef}
        goToNextStep={goToNextStep}
        closeDialog={closeDialog}
      />
    );
  }
  if (projectFragmentRef) {
    return (
      <RetroPGFAddProjectToBallotModalContent
        projectFragment={projectFragmentRef}
        goToNextStep={goToNextStep}
        closeDialog={closeDialog}
      />
    );
  }
  return null;
}
