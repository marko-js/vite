# Loading

```html
<div
  id="implicit"
>
  <button
    id="clickable"
  >
    foo Mounted: true Clicks: 0
  </button>
</div>
<pre>
    cjs-exports=[[object Object], 1, 2]
  cjs-module-exports=[[object Object], 1, 2]
  esm2cjs=[d, 1, 2]
  esm=[d, 1, 2]

</pre>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-    foo Mounted: true Clicks: 0
+    foo Mounted: true Clicks: 1

```

