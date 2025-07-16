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
      src="/src/components/logo.svg"
    />
    <img
      alt="logo"
      src="/src/components/logo.svg"
    />
    <script
      async=""
      src="./script.js"
    />
    <script
      async=""
      src="/src/components/script.js"
    />
    <link
      href="./styles.css"
      rel="stylesheet"
    />
    <link
      href="/src/components/styles.css"
      rel="stylesheet"
    />
  </div>
</div>
```

# Step 0
await page.click("#clickable")

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

