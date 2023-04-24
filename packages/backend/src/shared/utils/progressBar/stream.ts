import { WriteStream } from "tty";

export function replaceContents(tty: WriteStream, text: string) {
  tty.cursorTo(0);
  tty.write(text);
  tty.clearLine(1);
}
