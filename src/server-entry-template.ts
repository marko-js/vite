import path from "path";
export default async (opts: {
  fileName: string;
  entryData: string;
  runtimeId?: string;
  basePathVar?: string;
}): Promise<string> => {
  const fileNameStr = JSON.stringify(`./${path.basename(opts.fileName)}`);
  const base = opts.basePathVar ? ` base=${opts.basePathVar}` : "";
  return `import template from ${fileNameStr};
export * from ${fileNameStr};
${
  opts.basePathVar
    ? `
static if (typeof ${opts.basePathVar} !== "string") throw new Error("${opts.basePathVar} must be defined when using basePathVar.");
static if (!${opts.basePathVar}.endsWith("/")) throw new Error("${opts.basePathVar} must end with a '/' when using basePathVar.");
`
    : ""
}${
    opts.runtimeId
      ? `$ out.global.runtimeId = ${JSON.stringify(opts.runtimeId)};\n` +
        `$ out.global.___viteBaseVar = ${JSON.stringify(
          "$mbp_" + opts.runtimeId
        )};\n`
      : `$ out.global.___viteBaseVar = "$mbp";\n`
  }$ (out.global.___viteEntries || (out.global.___viteEntries = [])).push(${
    opts.entryData
  });
<_vite${base} slot="head-prepend"/>
<_vite${base} slot="head"/>
<_vite${base} slot="body-prepend"/>
<\${template} ...input/>
<init-components/>
<await-reorderer/>
<_vite${base} slot="body"/>
`;
};
