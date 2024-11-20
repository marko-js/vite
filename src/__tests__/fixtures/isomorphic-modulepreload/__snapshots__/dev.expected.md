# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: false Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /
  </div>
</div>
```

```diff
-    Mounted: false Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /
+    Mounted: true Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /

```

# Step 0
await page.click("#clickable")

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 1 LOGO_PATH: /src/components/logo.svg ENV: /
  </div>
</div>
```

