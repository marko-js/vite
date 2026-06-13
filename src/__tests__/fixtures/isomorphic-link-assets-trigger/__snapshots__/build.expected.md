# Loading

```html
<button
  id="load-lazy"
>
  Load lazy
</button>
<link
  href="/assets/lazy-[hash].css"
  rel="stylesheet"
/>
<button
  id="lazy-clickable"
>
  Lazy mounted: false Lazy clicks: 0
</button>
```

# Step 0
browser.window.document.querySelector("#load-lazy").click()

```diff
-  Lazy mounted: false Lazy clicks: 0
+  Lazy mounted: true Lazy clicks: 0

```

# Step 1
browser.window.document.querySelector("#lazy-clickable").click()

```diff
-  Lazy mounted: true Lazy clicks: 0
+  Lazy mounted: true Lazy clicks: 1

```

