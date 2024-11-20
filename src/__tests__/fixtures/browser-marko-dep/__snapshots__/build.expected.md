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
      Mounted: false Clicks: 0
    </div>
  </div>
</div>
```

```diff
-      Mounted: false Clicks: 0
+      Mounted: true Clicks: 0

```

# Step 0
await page.click("#clickable")

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
      Mounted: true Clicks: 1
    </div>
  </div>
</div>
```

