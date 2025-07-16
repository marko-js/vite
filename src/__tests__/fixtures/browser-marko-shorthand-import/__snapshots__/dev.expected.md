# Loading

```html
Loaded Implicit Component
<h1>
  test marko dep
</h1>
<div
  id="page"
>
  <div
    id="implicit"
  >
    <div
      id="clickable"
    >
      Mounted: true Clicks: 0
    </div>
  </div>
</div>
```

# Step 0
await page.click("#clickable")

```diff
-      Mounted: true Clicks: 0
+      Mounted: true Clicks: 1

```

