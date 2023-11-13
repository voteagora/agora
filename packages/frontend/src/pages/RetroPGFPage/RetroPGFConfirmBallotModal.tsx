import { css } from "@emotion/css";
import { VStack } from "../../components/VStack";
import { buttonStyles } from "../../pages/EditDelegatePage/EditDelegatePage";
import { icons } from "../../icons/icons";

interface RetroPGFConfirmBallotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RetroPGFConfirmBallotModal({
  isOpen,
  onClose,
}: RetroPGFConfirmBallotModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.5);
      `}
    >
      <div className="modal-content">
        <VStack>
          <img src={icons["ballot"]} alt={"ballot vote"} />
          <h2>Submit Ballot</h2>
          <p>
            Once you submit your ballot, you won't be able to change it. If you
            are ready, go ahead and submit!
          </p>
          <button
            className={css`
              ${buttonStyles};
            `}
            onClick={() => {
              // Handle the submission logic
              console.log("Submitting ballot...");
            }}
          >
            Submit
          </button>
          <button onClick={onClose}>Cancel</button>
        </VStack>
      </div>
    </div>
  );
}
