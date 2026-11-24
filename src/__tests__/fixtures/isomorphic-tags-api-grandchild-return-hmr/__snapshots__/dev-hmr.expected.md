# Loading

```html
<p>
  count 1
</p>
```

# HMR 0 (Reload)
src/tags/grandchild-tag.marko: "<return=1/>" → "<let/count=1/>\n<button#bump onClick() { count++ }>bump</button>\n<return=count/>"

```diff
+<button
  id="bump"
>
  bump
</button>

```

# HMR 0 Step 0
browser.window.document.querySelector("#bump").click()

```diff
-  count 1
+  count 2

```

