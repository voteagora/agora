import { ReactNode } from "react";
import { useNavigate } from "./HammockRouter";

type Props = {
  to: string;
  className?: string;
  children: ReactNode;
};

export function Link({ to, className, children }: Props) {
  const navigate = useNavigate();

  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        if (event.button !== 0) {
          return;
        }

        if (isModifiedEvent(event)) {
          return;
        }

        event.preventDefault();
        navigate({ path: to }, true);
      }}
    >
      {children}
    </a>
  );
}
function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
