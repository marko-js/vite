export default async (opts: {
  runtimeId?: string;
  templatePath: string;
  entryData: string;
}): Promise<string> => {
  const templatePathStr = JSON.stringify(opts.templatePath);
  return `import template from ${templatePathStr};
export * from ${templatePathStr};
$ const $global = out.global;
${
  opts.runtimeId
    ? `$ $global.runtimeId = ${JSON.stringify(opts.runtimeId)};\n`
    : ""
}$ ($global.___viteEntries || ($global.___viteEntries = [])).push(${
    opts.entryData
  });
<\${template} ...input/>
<init-components/>
<await-reorderer/>
`;
};
