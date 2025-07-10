# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 1
  </div>
</div>
```

```diff
-    Mounted: true Clicks: 1
+    Mounted: false Clicks: 0

```

```diff
-    Mounted: false Clicks: 0
+    Mounted: true Clicks: 0

```

# Step 0
await page.click("#clickable")

