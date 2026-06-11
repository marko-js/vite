# Loading

```html
<div
  id="implicit"
>
  <div
    id="clickable"
  >
    Mounted: true Clicks: 0
  </div>
</div>
```

# Step 0
browser.window.document.querySelector("#clickable").click()

```diff
-    Mounted: true Clicks: 0
+    Mounted: true Clicks: 1

```

# HMR 0 (No Reload)
src/components/class-component.marko: "Clicks: ${state.clickCount}" → "Click count: ${state.clickCount}"

```diff
-    Mounted: true Clicks: 1
+    Mounted: true Click count: 1

```

