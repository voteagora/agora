export function stripPrefix(str: string, prefix: string) {
  if (str.startsWith(prefix)) {
    return str.replace(prefix, "");
  }

  return null;
}
