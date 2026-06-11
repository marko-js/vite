# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0
  </div>
</div>
<div
  id="circular"
>
  Circular import value: 1
</div>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

