import { useEffect } from "react";

import { useNavigate } from "./HammockRouter";

type Props = {
  to: string;
};

export function Navigate({ to }: Props) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ path: to });
  }, [navigate, to]);

  return null;
}
