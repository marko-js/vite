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
<div>
  HELLO
</div>
```

# Step 0
await page.click("#clickable")

```diff
-    foo Mounted: true Clicks: 0
+    foo Mounted: true Clicks: 1

```

