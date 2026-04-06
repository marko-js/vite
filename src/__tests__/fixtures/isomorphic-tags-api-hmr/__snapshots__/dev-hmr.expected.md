# Loading

```html
<div>
  Hello World
</div>
```

# HMR 0
src/tags/child-tag.marko: "Hello ${input.name}" → "Hi ${input.name}"

```diff
-  Hello World
+  Hi World

```

# HMR 1
src/tags/child-tag.marko: "Hi ${input.name}" → "Hey ${JSON.parse(JSON.stringify(input)).name}"

```diff
-  Hi World
+  Hey World

```

