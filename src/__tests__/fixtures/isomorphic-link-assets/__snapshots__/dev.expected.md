# Loading

```html
<div
  id="clickable"
>
  Mounted: true Clicks: 0
</div>
<button
  id="lazy-clickable"
>
  Lazy mounted: true Lazy clicks: 0
</button>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-  Mounted: true Clicks: 0
+  Mounted: true Clicks: 1

```

# Step 1
browser.window.document.querySelector("#lazy-clickable").click()

```diff
-  Lazy mounted: true Lazy clicks: 0
+  Lazy mounted: true Lazy clicks: 1

```

