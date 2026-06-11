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
(0,import_assert.default)(hasScript(/\$mbp[a-z0-1-_\s]*=/i),"Base path script not found in head");browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /
+    Mounted: true Clicks: 1 LOGO_PATH: /src/components/logo.svg ENV: /

```

