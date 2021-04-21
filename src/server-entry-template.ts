import path from "path";
export default async (opts: {
  fileName: string;
  entryData: string;
  runtimeId?: string;
}): Promise<string> => {
  const fileNameStr = JSON.stringify(`./${path.basename(opts.fileName)}`);
  return `import template from ${fileNameStr};
export * from ${fileNameStr};
$ const $global = out.global;
${
  opts.runtimeId
    ? `$ $global.runtimeId = ${JSON.stringify(opts.runtimeId)};\n`
    : ""
}$ ($global.___viteEntries || ($global.___viteEntries = [])).push(${
    opts.entryData
  });
<_vite slot="head-prepend"/>
<_vite slot="head"/>
<_vite slot="body-prepend"/>
<\${template} ...input/>
<init-components/>
<await-reorderer/>
<_vite slot="body"/>
`;
};
