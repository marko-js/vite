import path from "path";
import { renderAssetsRuntimeId } from "./render-assets-runtime";
export default async (opts: {
  fileName: string;
  entryData: string[];
  runtimeId?: string;
  basePathVar?: string;
}): Promise<string> => {
  const fileNameStr = JSON.stringify(`./${path.basename(opts.fileName)}`);
  return `import template from ${fileNameStr};
export * from ${fileNameStr};
import { addAssets } from "${renderAssetsRuntimeId}";

$ const g = out.global;
$ addAssets(g, [${opts.entryData.join(",")}]);

<__flush_here_and_after__>
  $!{
    g.___viteRenderAssets("head-prepend") +
    g.___viteRenderAssets("head") +
    g.___viteRenderAssets("body-prepend")
  }
</__flush_here_and_after__>

<\${template} ...input/>
<init-components/>
<await-reorderer/>

<__flush_here_and_after__>
  $!{g.___viteRenderAssets("body")}
</__flush_here_and_after__>
`;
};
