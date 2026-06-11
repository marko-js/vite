# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /
  </div>
</div>
<div>
  PRELOAD: /my-prefix/[hash].js
</div>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /
+    Mounted: true Clicks: 1 LOGO_PATH: /my-prefix/logo-[hash].svg ENV: /

```

