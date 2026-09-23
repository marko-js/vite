```
    at src/template.marko:2:2
      1 | <let/x=1>
    > 2 | <if>a</if>
        |  ^^ The [`if` tag](https://markojs.com/docs/reference/core-tag#if--else) requires a [`value=` attribute](https://markojs.com/docs/reference/language#shorthand-value).
      3 | <if>b</if>
      4 |

    at src/template.marko:3:2
      1 | <let/x=1>
      2 | <if>a</if>
    > 3 | <if>b</if>
        |  ^^ The [`if` tag](https://markojs.com/docs/reference/core-tag#if--else) requires a [`value=` attribute](https://markojs.com/docs/reference/language#shorthand-value).
      4 |
  Plugin: marko-vite:pre
  File: src/template.marko
```
