import path from "path";
import { renderAssetsRuntimeId } from "./render-assets-runtime";
export default async (opts: {
  fileName: string;
  entryData: string[];
  runtimeId?: string;
  basePathVar?: string;
  tagsAPI?: boolean;
}): Promise<string> => {
  const addAssetsCall = `addAssets($global, [${opts.entryData.join(",")}])`;
  const fileNameStr = JSON.stringify(`./${path.basename(opts.fileName)}`);
  return `import template from ${fileNameStr};
export * from ${fileNameStr};
import { addAssets } from "${renderAssetsRuntimeId}";

${opts.tagsAPI ? `<const/writeSync=${addAssetsCall}/>` : `$ const writeSync = ${addAssetsCall};`}

${opts.tagsAPI ? "<if=writeSync>" : "<if(writeSync)>"}
  $!{
    $global.___viteRenderAssets("head-prepend") +
    $global.___viteRenderAssets("head") +
    $global.___viteRenderAssets("body-prepend")
  }
</>
<else>
  <__flush_here_and_after__>
    $!{
      $global.___viteRenderAssets("head-prepend") +
      $global.___viteRenderAssets("head") +
      $global.___viteRenderAssets("body-prepend")
    }
  </__flush_here_and_after__>
</>

<\${template} ...input/>${
    opts.tagsAPI
      ? ""
      : `
<init-components/>
<await-reorderer/>`
  }

${opts.tagsAPI ? "<if=writeSync>" : "<if(writeSync)>"}
  $!{$global.___viteRenderAssets("body")}
</>
<else>
  <__flush_here_and_after__>
    $!{$global.___viteRenderAssets("body")}
  </__flush_here_and_after__>
</>
`;
};
