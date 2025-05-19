# Loading

```html
<style
  marko-vite-preload=""
>
  html{visibility:hidden !important}
</style>
<script
  async=""
  blocking="render"
  marko-vite-preload=""
  type="module"
>
  await Promise.allSettled([import("/@vite/client"),import("/src/components/class-[hash].marko?marko-browser-entry")]);document.querySelectorAll('[marko-vite-preload]').forEach(el=&gt;el.remove());
</script>
```

```diff
+</script>
<div
  class="clickable"
>
  Mounted: false Clicks: 0
</div>
<style
  marko-vite-preload=""
>
  html{visibility:hidden !important}
</style>
<script
  async=""
  blocking="render"
  marko-vite-preload=""
  type="module"
>
  await Promise.allSettled([import("/@vite/client"),import("/src/components/class-[hash].marko?marko-browser-entry")]);document.querySelectorAll('[marko-vite-preload]').forEach(el=&gt;el.remove());

```

```diff
-</script>+</script>
<div
  class="clickable"
>
  Mounted: false Clicks: 0
</div>
```

```diff
-<style
  marko-vite-preload=""
>
  html{visibility:hidden !important}
</style>
<script
  async=""
  blocking="render"
  marko-vite-preload=""
  type="module"
>
  await Promise.allSettled([import("/@vite/client"),import("/src/components/class-[hash].marko?marko-browser-entry")]);document.querySelectorAll('[marko-vite-preload]').forEach(el=&gt;el.remove());
</script>
-<style
  marko-vite-preload=""
>
  html{visibility:hidden !important}
</style>
<script
  async=""
  blocking="render"
  marko-vite-preload=""
  type="module"
>
  await Promise.allSettled([import("/@vite/client"),import("/src/components/class-[hash].marko?marko-browser-entry")]);document.querySelectorAll('[marko-vite-preload]').forEach(el=&gt;el.remove());
</script>

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

