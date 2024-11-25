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
    return `import Template from ${fileNameStr};
export * from ${fileNameStr};
import { addAssets, getPrepend, getAppend } from "${renderAssetsRuntimeId}";
static function flush($global, html) {
  return getPrepend($global) + html + getAppend($global);
}
static function setFlush($global) {
  $global.__flush__ = flush;
}
static const assets = [${opts.entryData.join(",")}];
<const/writeSync=addAssets($global, assets) || setFlush($global)/>
-- $!{writeSync && getPrepend($global)}
<Template ...input/>
-- $!{writeSync && getAppend($global)}
`;
  }

  return `import template from ${fileNameStr};
export * from ${fileNameStr};
import { addAssets, getPrepend, getAppend } from "${renderAssetsRuntimeId}";
static const assets = [${opts.entryData.join(",")}];
<if(addAssets($global, assets))>
  $!{getPrepend($global)}
  <\${template} ...input/>
  $!{getAppend($global)}
</>
<else>
  <__flush_here_and_after__>$!{getPrepend($global)}</>
  <\${template} ...input/>
  <init-components/>
  <await-reorderer/>
  <__flush_here_and_after__>$!{getAppend($global)}</>
</>
`;
};
