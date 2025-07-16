# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0
    <img
      alt="logo"
      src="/assets/logo-[hash].svg"
    />
    <img
      alt="logo"
      src="/assets/logo-[hash].svg"
    />
    <script
      async=""
      src="./script.js"
    />
    <script
      async=""
      src="/assets/script-[hash].js"
    />
    <link
      href="./styles.css"
      rel="stylesheet"
    />
    <link
      href="/assets/styles-[hash].css"
      rel="stylesheet"
    />
  </div>
</div>
<pre>
  Error loading &lt;link rel="stylesheet" href="/assets/styles-[hash].css"&gt;

</pre>
```

# Step 0
await page.click("#clickable")

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

