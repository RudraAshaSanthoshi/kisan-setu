import fs from "fs";
import path from "path";

const localesDir = path.resolve(process.cwd(), "public", "locales");
const hiData = JSON.parse(fs.readFileSync(path.join(localesDir, "hi.json"), "utf8"));
const authDomain = hiData.auth;

const targets = ["te.json", "pa.json", "mr.json", "gu.json", "ta.json", "bn.json", "kn.json"];

for (const filename of targets) {
  const filePath = path.join(localesDir, filename);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!data.auth) {
      data.auth = authDomain;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(`Updated ${filename} with auth domain`);
    }
  }
}
console.log("Done syncing auth domain across all locale JSON files!");
