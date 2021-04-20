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
<vite slot="head-prepend" _p=2/>
<vite slot="head" _p=2/>
<vite slot="body-prepend" _p=2/>
<\${template} ...input/>
<init-components/>
<await-reorderer/>
<vite slot="body" _p=2/>
`;
};
