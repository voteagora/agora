import { ConnectKitButton } from "connectkit";
import { buttonStyle } from "../pages/ProposalsPage/ApprovalProposal/ApprovalCastVoteButton";
import { cx } from "@emotion/css";

function ConnectWalletButton({ className }: { className?: string }) {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, address }) => {
        return (
          <button onClick={show} className={cx([buttonStyle, className])}>
            {isConnected ? address : "Connect your wallet"}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}

export default ConnectWalletButton;
