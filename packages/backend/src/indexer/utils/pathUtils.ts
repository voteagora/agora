import { promises as fs } from "fs";
import path from "path";

export async function createParentDirectory(filePath: string) {
  const dirname = path.dirname(filePath);
  await fs.mkdir(dirname, { recursive: true });
}
