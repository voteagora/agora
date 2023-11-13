import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack } from "../../../components/VStack";
import { icons } from "../../../icons/icons";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";

export function RetroPGFBallotModalSuccess({
  onClose,
}: {
  onClose: () => void;
}) {
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
          width: 375px;
          padding: ${theme.spacing["6"]};
          box-shadow: ${theme.boxShadow.newDefault};
          & > div:last-child {
            border-bottom: none;
          }
        `}
      >
        <VStack gap="4">
          <div
            className={css`
              display: flex;
              width: 56px;
              height: 56px;
              align-items: center;
              justify-content: center;
              border-radius: ${theme.spacing["2"]};
              border-width: ${theme.spacing[1]};
              border-color: ${theme.colors.white};
              background: #ccf0c3;
              flex-shrink: 0;
              box-shadow: ${theme.boxShadow.newDefault};
              padding: ${theme.spacing["3"]};
            `}
          >
            <img
              className={css`
                width: 24px;
                height: 24px;
              `}
              src={icons.check}
              alt={icons.check}
            />
          </div>
          <div>
            <div
              className={css`
                font-weight: ${theme.fontWeight["semibold"]};
                margin-bottom: ${theme.spacing["1"]};
              `}
            >
              Your ballot has been submitted
            </div>
            <p>Thank you for voting in Retro Public Goods Funding!</p>
          </div>
          <VStack gap="1">
            <button
              className={css`
                ${buttonStyles};
              `}
            >
              Ballot successfully submitted
            </button>
            <button
              onClick={onClose}
              className={css`
                ${buttonStyles};
                border: none;
                box-shadow: none;
              `}
            >
              Done
            </button>
          </VStack>
        </VStack>
      </VStack>
    </VStack>
  );
}
