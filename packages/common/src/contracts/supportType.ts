export function toSupportType(value: number): "FOR" | "AGAINST" | "ABSTAIN" {
  switch (value) {
    case 0:
      return "AGAINST";
    case 1:
      return "FOR";
    case 2:
      return "ABSTAIN";
    default:
      throw new Error(`unknown type ${value}`);
  }
}
