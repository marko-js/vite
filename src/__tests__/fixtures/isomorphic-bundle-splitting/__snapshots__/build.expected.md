# Loading 0
```html
<script
  async=""
  crossorigin=""
  src="/assets/class-[hash].marko-[hash].js"
  type="module"
/>
```

# Loading 1
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
  Mounted: false Clicks: 0
</div>
<div
  class="clickable"
>
  Mounted: false Clicks: 0
</div>
```

# Loading 2
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

# Step 0-0
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
</div>```

# Step 0-1
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
  Mounted: true Clicks: 1
</div>```

