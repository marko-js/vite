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

```

# Step 0
(0,import_assert.default)(await hasScript(/\$mbp[a-z0-1-_\s]*=/i),"Base path script not found in head");await page.click("#clickable")

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
```

