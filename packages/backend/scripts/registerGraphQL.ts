// @ts-ignore
import * as fs from "fs";

// @ts-ignore
require.extensions[".graphql"] = function (module, filename) {
  // @ts-ignore
  module.exports = fs.readFileSync(filename, "utf-8");
};
