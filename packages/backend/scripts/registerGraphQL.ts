import * as fs from "fs";

require.extensions[".graphql"] = function (module, filename) {
  module.exports = fs.readFileSync(filename, "utf-8");
};
