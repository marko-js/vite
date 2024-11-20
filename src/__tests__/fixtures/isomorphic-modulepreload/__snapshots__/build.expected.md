# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: false Clicks: 0 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /
  </div>
</div>
```

```diff
-    Mounted: false Clicks: 0 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /
+    Mounted: true Clicks: 0 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /
+</div>
<div>
  PRELOAD: /my-prefix/read-[hash].js

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
    Mounted: true Clicks: 1 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /
  </div>
</div>
<div>
  PRELOAD: /my-prefix/read-[hash].js
</div>
```

