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
  </div>
</div>
```

```diff
+    <script
      async=""
      src="/src/components/script.js"
    />

```

```diff
+    <link
      href="./styles.css"
      rel="stylesheet"
    />

```

```diff
+    <link
      href="/src/components/styles.css"
      rel="stylesheet"
    />

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

