import type { Options } from "../../..";

export const ssr = true;
export const options: Options = { translator: "marko/translator" };
export const hmr = [
  {
    // A component file added beside a template recompiles it with the component.
    changes: [
      [
        "src/greeting.component.js",
        null,
        'export default {\n  onCreate() {\n    this.state = { message: "From component" };\n  },\n};\n',
      ],
    ],
  },
];
