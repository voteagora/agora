import { useParams } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { NounImage } from "../components/NounImage";

export function DelegatePage() {
  const { delegateId } = useParams();

  const delegate = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!) {
        delegate(id: $id) {
          nounsRepresented {
            id

            ...NounImageFragment
          }
        }
      }
    `,
    {
      id: delegateId ?? "",
    }
  );

  return (
    <>
      {delegate.delegate?.nounsRepresented.map((noun) => (
        <NounImage key={noun.id} fragmentRef={noun} />
      ))}
    </>
  );
}
