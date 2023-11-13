import { useState } from "react";
import { RetroPGFBallotModalContent } from "./RetroPGFBallotModalContent";
import { RetroPGFBallotModalConfirm } from "./RetroPGFBallotModalConfirm";
import { RetroPGFBallotModalSubmit } from "./RetorPGFBallotModalSubmit";
import { RetroPGFBallotModalSuccess } from "./RetroPGFBallotModalSuccess";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack } from "../../../components/VStack";

interface RetroPGFModalProps {
  listFragmentRef?: any;
  projectFragmentRef?: any;
  step: RetroPGFStep;
  closeDialog: () => void;
}

export enum RetroPGFStep {
  BALLOT = "BALLOT",
  CONFIRM = "CONFIRM",
  SUBMIT = "SUBMIT",
  SUCCESS = "SUCCESS",
}

export function RetroPGFAddToBallotModal({
  listFragmentRef,
  projectFragmentRef,
  step,
  closeDialog,
}: RetroPGFModalProps) {
  const [currentStep, setCurrentStep] = useState(step);

  const goToNextStep = () => {
    switch (currentStep) {
      case RetroPGFStep.BALLOT:
        setCurrentStep(RetroPGFStep.CONFIRM);
        break;
      case RetroPGFStep.CONFIRM:
        setCurrentStep(RetroPGFStep.SUBMIT);
        break;
      case RetroPGFStep.SUBMIT:
        setCurrentStep(RetroPGFStep.SUCCESS);
        break;
      default:
        break;
    }
  };

  const closeModal = () => {
    setCurrentStep(step);
    closeDialog();
  };

  return (
    <VStack alignItems="center">
      <Dialog.Panel
        as={motion.div}
        initial={{
          scale: 0.9,
          translateY: theme.spacing["8"],
        }}
        animate={{ translateY: 0, scale: 1 }}
        className={css`
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["6"]};
        `}
      >
        {(() => {
          switch (currentStep) {
            case RetroPGFStep.BALLOT:
              return (
                <RetroPGFBallotModalContent
                  listFragmentRef={listFragmentRef}
                  projectFragmentRef={projectFragmentRef}
                  goToNextStep={goToNextStep}
                  closeDialog={closeDialog}
                />
              );
            case RetroPGFStep.CONFIRM:
              return <RetroPGFBallotModalConfirm onClose={closeModal} />;
            case RetroPGFStep.SUBMIT:
              return (
                <RetroPGFBallotModalSubmit
                  onClose={closeModal}
                  goToNextStep={goToNextStep}
                />
              );
            case RetroPGFStep.SUCCESS:
              return <RetroPGFBallotModalSuccess onClose={closeModal} />;
          }
        })()}
      </Dialog.Panel>
    </VStack>
  );
}
