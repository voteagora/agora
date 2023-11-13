import { css, cx } from "@emotion/css";

export function Tab<T extends string>({
  name,
  activePage,
  className,
  setActivePage,
  displayName,
}: {
  name: T;
  activePage: string;
  className?: string;
  setActivePage: (name: T) => void;
  displayName?: string;
}) {
  const isActive = activePage === name;

  return (
    <div
      onClick={() => setActivePage(name)}
      className={cx(
        css`
          opacity: ${!isActive && 0.2};
          cursor: pointer;
          :hover {
            opacity: 1;
          }
          transition: opacity 0.1s ease-in-out;
        `,
        className
      )}
    >
      {displayName ??
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
    </div>
  );
}
