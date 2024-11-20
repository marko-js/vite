# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: false Clicks: 0
    <img
      alt="logo"
      src="/some/base/path/assets/logo-[hash].svg"
    />
  </div>
</div>
```

```diff
-    Mounted: false Clicks: 0
+    Mounted: true Clicks: 0

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
    Mounted: true Clicks: 1
    <img
      alt="logo"
      src="/some/base/path/assets/logo-[hash].svg"
    />
  </div>
</div>
```

