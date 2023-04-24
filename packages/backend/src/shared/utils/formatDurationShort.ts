import { formatDuration } from "date-fns";

export function formatDurationShort(duration: Duration) {
  return formatDuration(duration, {
    format: ["hours", "minutes", "seconds"],
    delimiter: "",
  })
    .replace(/ hours?/, "h")
    .replace(/ minutes?/, "m")
    .replace(/ seconds?/, "s");
}
