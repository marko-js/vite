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
$ const writeSync = addAssets(g, [${opts.entryData.join(",")}]);

<if(writeSync)>
  $!{
    g.___viteRenderAssets("head-prepend") +
    g.___viteRenderAssets("head") +
    g.___viteRenderAssets("body-prepend")
  }
</>
<else>
  <__flush_here_and_after__>
    $!{
      g.___viteRenderAssets("head-prepend") +
      g.___viteRenderAssets("head") +
      g.___viteRenderAssets("body-prepend")
    }
  </__flush_here_and_after__>
</>

<\${template} ...input/>
<init-components/>
<await-reorderer/>

<if(writeSync)>
  $!{g.___viteRenderAssets("body")}
</>
<else>
  <__flush_here_and_after__>
    $!{g.___viteRenderAssets("body")}
  </__flush_here_and_after__>
</>
`;
};
