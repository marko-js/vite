# Loading

```html
<div
  id="implicit"
>
  <button
    id="clickable"
  >
    foo Mounted: false Clicks: 0
  </button>
</div>
<pre>
    cjs-exports=[[object Object], 1, 2]
  cjs-module-exports=[[object Object], 1, 2]
  esm2cjs=[d, 1, 2]
  esm=[d, 1, 2]

</pre>
```

```diff
-    foo Mounted: false Clicks: 0
+    foo Mounted: true Clicks: 0

```

# Step 0
await page.click("#clickable")

```html
<div
  id="implicit"
>
  <button
    id="clickable"
  >
    foo Mounted: true Clicks: 1
  </button>
</div>
<pre>
    cjs-exports=[[object Object], 1, 2]
  cjs-module-exports=[[object Object], 1, 2]
  esm2cjs=[d, 1, 2]
  esm=[d, 1, 2]

</pre>
```

