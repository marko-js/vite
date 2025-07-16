# Loading

```html
<script
  async=""
  crossorigin=""
  src="/assets/class-[hash].marko-[hash].js"
  type="module"
/>
<link
  crossorigin=""
  href="/assets/modulepreload-[hash].js"
  rel="modulepreload"
/>
<div
  class="clickable"
>
  Mounted: true Clicks: 0
</div>
<div
  class="clickable"
>
  Mounted: true Clicks: 0
</div>
```

# Step 0
for(const el of await page.$$(".clickable")){await el.click()

```diff
-  Mounted: true Clicks: 0
+  Mounted: true Clicks: 1
-  Mounted: true Clicks: 0
+  Mounted: true Clicks: 1

```

