# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Color: rgb(0, 128, 0)
  </div>
</div>
```

# HMR 0
src/template.marko: "div { color: green }" → "div { color: blue }"

(no change)

# HMR 0 Step 0
await page.click("#clickable")

```diff
-    Color: rgb(0, 128, 0)
+    Color: rgb(0, 0, 255)

```

# HMR 1
src/template.marko: "div { color: blue }" → "div { color: red }"

(no change)

# HMR 1 Step 0
await page.click("#clickable")

```diff
-    Color: rgb(0, 0, 255)
+    Color: rgb(255, 0, 0)

```

