declare module "react-window-scroller" {
  import { FixedSizeList, ListOnScrollProps } from "react-window";
  import { FunctionComponent, Ref } from "react";

  type ChildrenParams = {
    ref: Ref<FixedSizeList>;
    outerRef: Ref<any>;
    style: Record<string, string>;
    onScroll: (props: ListOnScrollProps) => void;
  };

  type Props = {
    /**
     * Timing (ms) for the throttle on window scroll event handler
     *
     * @default 10
     */
    throttleTime?: number;

    // /**
    //  * Set to true if rendering a react-window Grid component
    //  * (FixedSizeGrid or VariableSizeGrid).
    //  *
    //  * @default false
    //  */
    // isGrid?: boolean;

    children: (params: ChildrenParams) => void;
  };

  export const ReactWindowScroller: FunctionComponent<Props>;
}
