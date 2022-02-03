import util from "util";
import fs from "fs";
import path from "path";

const rename = util.promisify(fs.rename);

export const changeExtension = async (file_path: string, extension: string) => {
  const current_extension = path.extname(file_path);

  const new_extension = extension.startsWith(".")
    ? extension.slice(1)
    : extension;

  if (current_extension.length > 0) {
    const new_path = file_path.replace(current_extension, `.${new_extension}`);
    await rename(file_path, new_path);
  }
};
