import { css } from "@emotion/css";
import { HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { useAccount } from "wagmi";
import ConnectWalletButton from "../../components/ConnectWalletButton";
import InfoPanel from "./InfoPanel";
import { CreateProposalForm } from "./CreateProposalForm";

function CreateProposalPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <ConnectWalletButton
        className={css`
          padding: ${theme.spacing["4"]} ${theme.spacing["8"]};
          width: fit-content;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        `}
      />
    );
  }

  return (
    <HStack
      justifyContent="space-between"
      gap="16"
      className={css`
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        margin-top: ${theme.spacing["8"]};
        margin-bottom: ${theme.spacing["8"]};
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        font-family: ${theme.fontFamily.inter};

        @media (max-width: ${theme.maxWidth["4xl"]}) {
          flex-direction: column-reverse;
          align-items: center;
        }
      `}
    >
      <CreateProposalForm />

      <div
        className={css`
          flex-shrink: 0;
          width: ${theme.maxWidth.xs};

          @media (max-width: ${theme.maxWidth["4xl"]}) {
            width: 100%;
          }
        `}
      >
        <InfoPanel />
      </div>
    </HStack>
  );
}

export default CreateProposalPage;
