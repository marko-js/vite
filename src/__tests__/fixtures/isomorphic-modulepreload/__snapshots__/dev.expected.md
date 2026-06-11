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
browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0 LOGO_PATH: /src/components/logo.svg ENV: /
+    Mounted: true Clicks: 1 LOGO_PATH: /src/components/logo.svg ENV: /

```

