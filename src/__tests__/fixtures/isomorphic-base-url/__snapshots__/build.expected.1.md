# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 2
    <img
      alt="logo"
      src="/some/base/path/src/components/logo.svg"
    />
  </div>
</div>
```

```diff
-    Mounted: true Clicks: 2
+    Mounted: false Clicks: 0
-      src="/some/base/path/src/components/logo.svg"
+      src="/some/base/path/assets/logo-[hash].svg"

```

```diff
-    Mounted: false Clicks: 0
+    Mounted: true Clicks: 0

```

# Step 0
await page.click("#clickable")

