import path from "path";

import { renderAssetsRuntimeId } from "./render-assets-runtime";
export default async (opts: {
  fileName: string;
  entryData: string[];
  runtimeId?: string;
  basePathVar?: string;
  tagsAPI?: boolean;
}): Promise<string> => {
  const fileNameStr = JSON.stringify(`./${path.basename(opts.fileName)}`);

  if (opts.tagsAPI) {
    return `
<!-- use tags -->
import Template from ${fileNameStr};
export * from ${fileNameStr};
import { addAssets, getPrepend, getAppend } from "${renderAssetsRuntimeId}";
static function flush($global, html) {
  return getPrepend($global) + html + getAppend($global);
}
static function setFlush($global) {
  $global.__flush__ = flush;
}
<const/writeSync=addAssets($global, [${opts.entryData.join(",")}]) || setFlush($global)/>
-- $!{writeSync && getPrepend($global)}
<Template ...input/>
-- $!{writeSync && getAppend($global)}
`;
  }

  return `
<!-- use class -->
import Template from ${fileNameStr};
export * from ${fileNameStr};
import { addAssets, getPrepend, getAppend } from "${renderAssetsRuntimeId}";
<if(addAssets($global, [${opts.entryData.join(",")}]))>
  $!{getPrepend($global)}
  <Template ...input/>
  $!{getAppend($global)}
</>
<else>
  <__flush_here_and_after__>$!{getPrepend($global)}</>
  <Template ...input/>
  <init-components/>
  <await-reorderer/>
  <__flush_here_and_after__>$!{getAppend($global)}</>
</>
`;
};
