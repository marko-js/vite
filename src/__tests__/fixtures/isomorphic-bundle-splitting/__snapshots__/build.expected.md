# Loading

```html
<script
  async=""
  crossorigin=""
  src="/assets/class-[hash].marko-[hash].js"
  type="module"
/>
```

```diff
-/>+/>
<link
  crossorigin=""
  href="/assets/modulepreload-[hash].js"
  rel="modulepreload"
/>
<div
  class="clickable"
>
  Mounted: false Clicks: 0
</div>
<div
  class="clickable"
>
  Mounted: false Clicks: 0
</div>
```

```diff
-  Mounted: false Clicks: 0
+  Mounted: true Clicks: 0
-  Mounted: false Clicks: 0
+  Mounted: true Clicks: 0

```

# Step 0
for(const el of await page.$$(".clickable")){await el.click()

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
  Mounted: true Clicks: 1
</div>
<div
  class="clickable"
>
  Mounted: true Clicks: 0
</div>
```

```diff
-  Mounted: true Clicks: 0
+  Mounted: true Clicks: 1

```

