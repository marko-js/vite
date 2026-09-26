# Loading

```html
<div
  class="_box_scoped"
>
  <div
    class="_box_scoped"
  >
    one
  </div>
</div>
```

# Step 0
const app=browser.window.document.getElementById("app");for(const el of browser.window.document.querySelectorAll("link[rel=stylesheet], link[rel=modulepreload], script[src]")){app.append(`[${el.tagName.toLowerCase()

```diff
-</div>+</div>
[link: /assets/layout-[hash].css][link: /assets/tag-[hash].css][script: /assets/template-[hash].marko-[hash].js][link: /assets/[hash].js]
```

