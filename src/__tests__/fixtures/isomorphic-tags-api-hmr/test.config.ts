export const ssr = true;
export const hmr = [
  {
    // Step 1: Simple text change in the child tag (should trigger live reload).
    changes: [
      ["src/tags/child-tag.marko", "Hello ${input.name}", "Hi ${input.name}"],
    ],
  },
  {
    // Step 2: Change child from destructured input to whole input reference.
    // This changes the child's exported API (from $name to $input),
    // which requires the parent template to be recompiled.
    changes: [
      [
        "src/tags/child-tag.marko",
        "Hi ${input.name}",
        "Hey ${JSON.parse(JSON.stringify(input)).name}",
      ],
    ],
  },
];
