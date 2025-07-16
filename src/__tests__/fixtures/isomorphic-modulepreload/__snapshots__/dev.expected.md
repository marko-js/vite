# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /
  </div>
</div>
```

# Step 0
await page.click("#clickable")

```diff
-    Mounted: true Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /
+    Mounted: true Clicks: 1 LOGO_PATH: /src/components/logo.svg ENV: /

```

