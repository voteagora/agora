import { CSSProperties, ReactNode } from "react";
import { useNavigate } from "./HammockRouter";
import { useOpenDialogOptional } from "../DialogProvider/DialogProvider";

type Props = {
  to: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
};

export function Link({ to, className, children, style }: Props) {
  const navigate = useNavigate();
  const openDialog = useOpenDialogOptional();

  return (
    <a
      className={className}
      style={style}
      href={to}
      onClick={(event) => {
        if (event.button !== 0) {
          return;
        }

        if (isModifiedEvent(event)) {
          return;
        }

        event.preventDefault();
        navigate({ path: to }, true, () => {
          openDialog?.(null);
        });
      }}
    >
      {children}
    </a>
  );
}
function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
