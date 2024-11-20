# Loading

```html
<script
  async=""
  blocking="render"
  class="marko-vite-preload"
  type="module"
>
  import "/@vite/client";import "/src/components/class-[hash].marko?marko-browser-entry";document.querySelectorAll('.marko-vite-preload').forEach((el) =&gt; el.remove());document.documentElement.style.visibility='';if(document.documentElement.getAttribute('style')==='')document.documentElement.removeAttribute('style');
</script>
```

```diff
+</script>
<script
  class="marko-vite-preload"
>
  document.documentElement.style.visibility='hidden'

```

```diff
-</script>+</script>
<div
  class="clickable"
>
  Mounted: false Clicks: 0
</div>
<script
  async=""
  src="/src/template.marko?marko-browser-entry"
  type="module"
/>
```

```diff
+/>
<script
  async=""
  src="/src/components/class-[hash].marko?marko-browser-entry"
  type="module"

```

```diff
-/>+/>
<script
  async=""
  blocking="render"
  class="marko-vite-preload"
  type="module"
>
  import "/@vite/client";import "/src/components/class-[hash].marko?marko-browser-entry";document.querySelectorAll('.marko-vite-preload').forEach((el) =&gt; el.remove());document.documentElement.style.visibility='';if(document.documentElement.getAttribute('style')==='')document.documentElement.removeAttribute('style');
</script>
```

```diff
+</script>
<script
  class="marko-vite-preload"
>
  document.documentElement.style.visibility='hidden'

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
-<script
  async=""
  blocking="render"
  class="marko-vite-preload"
  type="module"
>
  import "/@vite/client";import "/src/components/class-[hash].marko?marko-browser-entry";document.querySelectorAll('.marko-vite-preload').forEach((el) =&gt; el.remove());document.documentElement.style.visibility='';if(document.documentElement.getAttribute('style')==='')document.documentElement.removeAttribute('style');
</script>
<script
  class="marko-vite-preload"
>
  document.documentElement.style.visibility='hidden'
</script>
-<script
  async=""
  blocking="render"
  class="marko-vite-preload"
  type="module"
>
  import "/@vite/client";import "/src/components/class-[hash].marko?marko-browser-entry";document.querySelectorAll('.marko-vite-preload').forEach((el) =&gt; el.remove());document.documentElement.style.visibility='';if(document.documentElement.getAttribute('style')==='')document.documentElement.removeAttribute('style');
</script>
<script
  class="marko-vite-preload"
>
  document.documentElement.style.visibility='hidden'
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
<script
  async=""
  src="/src/template.marko?marko-browser-entry"
  type="module"
/>
<script
  async=""
  src="/src/components/class-[hash].marko?marko-browser-entry"
  type="module"
/>
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

