# Loading

```html
<h1>
  Hello
</h1>
<div
  id="implicit"
>
  <h2>
    Server text
  </h2>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0
  </div>
</div>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

