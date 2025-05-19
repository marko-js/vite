# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: false Clicks: 0
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
  </div>
</div>
```

```diff
+    <script
      async=""
      src="/assets/script-[hash].js"
    />

```

```diff
+    <link
      href="./styles.css"
      rel="stylesheet"
    />
    <link
      href="/assets/styles-[hash].css"
      rel="stylesheet"
    />

```

```diff
-</div>+</div>
<pre>
  Error loading &lt;link rel="stylesheet" href="/assets/styles-[hash].css"&gt;

</pre>
```

```diff
-    Mounted: false Clicks: 0
+    Mounted: true Clicks: 0

```

# Step 0
await page.click("#clickable")

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 1
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

