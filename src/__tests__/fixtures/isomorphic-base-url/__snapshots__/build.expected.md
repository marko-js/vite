# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0
    <img
      alt="logo"
      src="/some/base/path/assets/logo-[hash].svg"
    />
  </div>
</div>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

