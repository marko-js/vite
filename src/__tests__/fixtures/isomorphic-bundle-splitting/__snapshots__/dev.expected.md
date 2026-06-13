# Loading

```html
<script
  async=""
  src="/src/components/class-[hash].client-[hash].marko"
  type="module"
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
for(const el of browser.window.document.querySelectorAll(".clickable")){el.click()

```diff
-  Mounted: true Clicks: 0
+  Mounted: true Clicks: 1
-  Mounted: true Clicks: 0
+  Mounted: true Clicks: 1

```

