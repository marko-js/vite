# Loading

```html
<div
  id="clickable"
>
  Mounted: false Clicks: 0
</div>
```

```diff
-  Mounted: false Clicks: 0
+  Mounted: true Clicks: 0

```

# Step 0
await page.click("#clickable")

```html
<div
  id="clickable"
>
  Mounted: true Clicks: 1
</div>
```

