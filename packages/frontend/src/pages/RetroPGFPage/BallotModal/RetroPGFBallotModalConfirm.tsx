import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack } from "../../../components/VStack";
import { icons } from "../../../icons/icons";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";
import { useNavigate } from "../../../components/HammockRouter/HammockRouter";

export function RetroPGFBallotModalConfirm({
  onClose,
}: {
  onClose: () => void;
}) {
  const navigate = useNavigate();

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
                margin-top: ${theme.spacing["4"]};
                font-weight: ${theme.fontWeight["semibold"]};
                margin-bottom: ${theme.spacing["1"]};
              `}
            >
              Your ballot has been updated
            </div>
            <p>
              You can continue adding more projects to your ballot or, if you’re
              done, submit your current ballot as your vote.
            </p>
          </div>
          <VStack gap="1">
            <button
              className={css`
                ${buttonStyles};
              `}
              onClick={onClose}
            >
              Continue adding projects
            </button>
            <button
              onClick={() => {
                navigate({ path: "/retropgf/3/ballot" });
                onClose();
              }}
              className={css`
                ${buttonStyles};
                box-shadow: none;
                border: none;
              `}
            >
              View ballot
            </button>
          </VStack>
        </VStack>
      </VStack>
    </VStack>
  );
}
