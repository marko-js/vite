# Loading

```html
<h1>
  Hello
</h1>
<div
  id="implicit"
>
  <h2>
    Server text
  </h2>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0
  </div>
</div>
```

# Step 0
await page.click("#clickable")

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

# HMR 0 (Reload)
src/template.marko: "<h1>Hello</h1>" → "<h1>Goodbye</h1>"

```diff
-  Hello
+  Goodbye
-    Mounted: true Clicks: 1
+    Mounted: true Clicks: 0

```

# HMR 0 Step 0
await page.click("#clickable")

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

# HMR 1 (Reload)
src/components/implicit-component.marko: "<h2>Server text</h2>" → "<h2>Updated</h2>"

```diff
-    Server text
+    Updated
-    Mounted: true Clicks: 1
+    Mounted: true Clicks: 0

```

