# Changelog

## 4.1.8

### Patch Changes

- [#126](https://github.com/marko-js/vite/pull/126) [`68b6cc3`](https://github.com/marko-js/vite/commit/68b6cc3fb3efdf791653aa0bcb8b9e8362c244bf) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Ignore errors caused by cjs => esm conversion

## 4.1.7

### Patch Changes

- [#124](https://github.com/marko-js/vite/pull/124) [`ff93773`](https://github.com/marko-js/vite/commit/ff937737d63baf628830423798856ace06b54969) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue where filename from vites watcher was not in posix which was preventing clearing cached data.

## 4.1.6

### Patch Changes

- [#122](https://github.com/marko-js/vite/pull/122) [`9cf3be1`](https://github.com/marko-js/vite/commit/9cf3be1fdedaa81c8ac0d4f7514ce85b0cb3c01a) Thanks [@rturnq](https://github.com/rturnq)! - Move transform lib to dependencies from devDependencies

## 4.1.5

### Patch Changes

- [#117](https://github.com/marko-js/vite/pull/117) [`7a3a5e6`](https://github.com/marko-js/vite/commit/7a3a5e6bcce92bec30b0ece4f6dcc8ae29ea77c2) Thanks [@rturnq](https://github.com/rturnq)! - Support css-loader imports, limit relative src attribute transforms, support BASE_URL env var

- [#120](https://github.com/marko-js/vite/pull/120) [`90cca62`](https://github.com/marko-js/vite/commit/90cca62c472becd7a50171237592ae3a91068d2a) Thanks [@rturnq](https://github.com/rturnq)! - Allow importing assets from marko file in cjs libs

## 4.1.4

### Patch Changes

- [#118](https://github.com/marko-js/vite/pull/118) [`3818a34`](https://github.com/marko-js/vite/commit/3818a3439b9607b4e6c8932ebbc164c137527b7e) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue where asset related Marko taglibs / transforms were registered when not in linked mode (eg in tests)

## 4.1.3

### Patch Changes

- [#115](https://github.com/marko-js/vite/pull/115) [`14834ed`](https://github.com/marko-js/vite/commit/14834ed6d48f39916fe71e801a7c07d5f3dac1aa) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix typo from previous vitest fix pr.

## 4.1.2

### Patch Changes

- [#113](https://github.com/marko-js/vite/pull/113) [`9838963`](https://github.com/marko-js/vite/commit/9838963c0dd7d4879de2aa4378d4c8b52b07569f) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue with latest versions of vitest.

## 4.1.1

### Patch Changes

- [#111](https://github.com/marko-js/vite/pull/111) [`a1c8ff9`](https://github.com/marko-js/vite/commit/a1c8ff9fc79419432d4aa9ecfe0ae83fb6c59798) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix caching issue with virtual Marko files created by arc

## 4.1.0

### Minor Changes

- [#109](https://github.com/marko-js/vite/pull/109) [`257b5d0`](https://github.com/marko-js/vite/commit/257b5d0ed94425ff9f9e6429a0f1326e19bf3ebe) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Support inline relative asset paths from native tags.

## 4.0.4

### Patch Changes

- [#107](https://github.com/marko-js/vite/pull/107) [`797b2c7`](https://github.com/marko-js/vite/commit/797b2c75260384816c66ad7d2fe89ad8b03dd24e) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue where vite dependency scan comes from a js/ts file into a Marko file. In this case we no longer give vite back the hydrate output, but the full compiled template from esbuild.

## 4.0.3

### Patch Changes

- [#105](https://github.com/marko-js/vite/pull/105) [`3aca277`](https://github.com/marko-js/vite/commit/3aca2777444af5b6408d2f0dffd8b4b0840acf1f) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue with mismatches MARKO_DEBUG environment and optimize compiler option.

## 4.0.2

### Patch Changes

- [#103](https://github.com/marko-js/vite/pull/103) [`16c1d7f`](https://github.com/marko-js/vite/commit/16c1d7fef3443cae289b98476e65a5de168073ed) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Add support for arc-vite and adaptive Marko files

## 4.0.1

### Patch Changes

- [#101](https://github.com/marko-js/vite/pull/101) [`0601f65`](https://github.com/marko-js/vite/commit/0601f650c007704299e94163298aa97a88762711) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix regression when setting basePathVar in dev mode and runtimeId.

## 4.0.0

### Major Changes

- [#99](https://github.com/marko-js/vite/pull/99) [`0bc357e`](https://github.com/marko-js/vite/commit/0bc357ebcf7850fb0592314f930301f31e2835df) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - - Removes the `store` config option. (BREAKING CHANGE).
  - Adds a new hook for other vite plugins to add assets to the @marko/vite server entries.
  - Optimize server entry code.

## 3.1.6

### Patch Changes

- [#97](https://github.com/marko-js/vite/pull/97) [`79d62e3`](https://github.com/marko-js/vite/commit/79d62e3c047bf47c4271d3ed44fc5bb73a176984) Thanks [@rturnq](https://github.com/rturnq)! - Fix issues with CJS interop and fix esbuild plugin resolution

## 3.1.5

### Patch Changes

- [#94](https://github.com/marko-js/vite/pull/94) [`1096959`](https://github.com/marko-js/vite/commit/1096959837711683f85a4a97eeb3fa971b073671) Thanks [@rturnq](https://github.com/rturnq)! - Marko CJS interop in SSR

## 3.1.4

### Patch Changes

- [#91](https://github.com/marko-js/vite/pull/91) [`16f6a11`](https://github.com/marko-js/vite/commit/16f6a112723ac6ea333fefca9e899e91944887f9) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue where encoding virtual files was not working in prod builds.

## 3.1.3

### Patch Changes

- [#88](https://github.com/marko-js/vite/pull/88) [`f9644fe`](https://github.com/marko-js/vite/commit/f9644fe150f0ce988e27b64e51776e0abb6ac841) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Optimize check for if a Marko module is in a cjs package.

## 3.1.2

### Patch Changes

- [#86](https://github.com/marko-js/vite/pull/86) [`701d0f9`](https://github.com/marko-js/vite/commit/701d0f9b4b6ec1e8b2bf921177e7397301077ab5) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix regression which prevented SSR cjs Marko files from being properly bundled.

## 3.1.1

### Patch Changes

- [`3f5e52e`](https://github.com/marko-js/vite/commit/3f5e52ed62fd0dbc63f906f73c46a43f7e386a7e) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue where queries added from vitest were not being stripped

## 3.1.0

### Minor Changes

- [#83](https://github.com/marko-js/vite/pull/83) [`4c8183c`](https://github.com/marko-js/vite/commit/4c8183c94ffe2cca08f6a65d6218d1fe0dce66c0) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Support Vite's dependency optimization scanning.

### Patch Changes

- [#83](https://github.com/marko-js/vite/pull/83) [`4c8183c`](https://github.com/marko-js/vite/commit/4c8183c94ffe2cca08f6a65d6218d1fe0dce66c0) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Improve commonjs interop for node_module `.marko` files which do not render any tags and/or use `export * from`.

- [#83](https://github.com/marko-js/vite/pull/83) [`4c8183c`](https://github.com/marko-js/vite/commit/4c8183c94ffe2cca08f6a65d6218d1fe0dce66c0) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Improve support for Vitest by stripping off queries it adds before determining if we should process the module as a Marko file.

## 3.0.1

### Patch Changes

- [#81](https://github.com/marko-js/vite/pull/81) [`7a4b118`](https://github.com/marko-js/vite/commit/7a4b118982ef9b59db0bd9b6d0bfcad69ef248f9) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix support for using this plugin with Vitest and a browser environment.

## 3.0.0

### Major Changes

- [#79](https://github.com/marko-js/vite/pull/79) [`bf735ba`](https://github.com/marko-js/vite/commit/bf735ba52aab7050d37e5c0ae8c8b20c48bab502) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - When using a runtime base path via the `basePathVar` option the vite [build.assetsDir](https://vitejs.dev/config/build-options.html#build-assetsdir) is now stripped from the final url. (You could add this back manually yourself if desired).

- [#79](https://github.com/marko-js/vite/pull/79) [`d0c2b50`](https://github.com/marko-js/vite/commit/d0c2b50e36d239dbd39b4261f11ed457343ff518) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - No longer load babel config by default unless configured.

## 2.4.9

### Patch Changes

- [#77](https://github.com/marko-js/vite/pull/77) [`1058400`](https://github.com/marko-js/vite/commit/10584002a4722f2494f7b25fec02d509f51ade97) Thanks [@rturnq](https://github.com/rturnq)! - Ensure base path script is written in head or body when those elements are present

## 2.4.8

### Patch Changes

- [#71](https://github.com/marko-js/vite/pull/71) [`231c767`](https://github.com/marko-js/vite/commit/231c767939e8b2cd6a601dbee11a049183070dec) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix server entry file cache for build mode.

## 2.4.7

### Patch Changes

- [#69](https://github.com/marko-js/vite/pull/69) [`87fe302`](https://github.com/marko-js/vite/commit/87fe30279199014d1b9bd6a42029bffdfc0b4130) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Ensure browser entry query is added before transformIndexHTML. Without this Vite was incorrectly caching the module url.

- [#69](https://github.com/marko-js/vite/pull/69) [`87fe302`](https://github.com/marko-js/vite/commit/87fe30279199014d1b9bd6a42029bffdfc0b4130) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Ensure server entry files cache their content (improves virtual file support).

## 2.4.6

### Patch Changes

- [#67](https://github.com/marko-js/vite/pull/67) [`e3015db`](https://github.com/marko-js/vite/commit/e3015db3bd505b6649715603d8a3f7b17ed27d14) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Improve HMR support by ensuring that client and server compiled modules have different resolved ids.

## 2.4.5

### Patch Changes

- [`29c2f40`](https://github.com/marko-js/vite/commit/29c2f40879f6db5062defb059eebd6d142b5df24) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Avoid FOUC for dev mode page reloads.

## 2.4.4

### Patch Changes

- [#63](https://github.com/marko-js/vite/pull/63) [`53955dc`](https://github.com/marko-js/vite/commit/53955dc94bfc0aa69f1744b9b086bfb4f92d15d9) Thanks [@rturnq](https://github.com/rturnq)! - Evaluate options in config hook

## 2.4.3

### Patch Changes

- [#61](https://github.com/marko-js/vite/pull/61) [`d1a0460`](https://github.com/marko-js/vite/commit/d1a0460554e8c46caa105a6fb64cfa316ed42b58) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Disable linked mode automatically for vitest

## 2.4.2

### Patch Changes

- [#60](https://github.com/marko-js/vite/pull/60) [`9950f8a`](https://github.com/marko-js/vite/commit/9950f8a44040e6bddb9e8300b3b7d062956c4d93) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Improve vitest support around CJS node_modules

- [#58](https://github.com/marko-js/vite/pull/58) [`5968d1b`](https://github.com/marko-js/vite/commit/5968d1b8ac9444e70058bdfdaab0c4e626795954) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fixes an issue where the ssr check was not accurate for the transform hook.

## 2.4.1

### Patch Changes

- [#56](https://github.com/marko-js/vite/pull/56) [`b8c6e7e`](https://github.com/marko-js/vite/commit/b8c6e7e6859c5466174176c09f0677a1bdd16430) Thanks [@rturnq](https://github.com/rturnq)! - fix: preload base path

## 2.4.0

### Minor Changes

- [#51](https://github.com/marko-js/vite/pull/51) [`356df24`](https://github.com/marko-js/vite/commit/356df249df3751b087ebb01bf190cd7749496280) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Add support for a dynamic runtime asset base url.

### Patch Changes

- [#54](https://github.com/marko-js/vite/pull/54) [`597770a`](https://github.com/marko-js/vite/commit/597770a6ac089770659a324484fa534ae7aab1a4) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix resolving files from virtual files (eg inline stylesheets).

- [#50](https://github.com/marko-js/vite/pull/50) [`e014eb9`](https://github.com/marko-js/vite/commit/e014eb90dc4bfda7f2928e44a0568ac133d860d0) Thanks [@rturnq](https://github.com/rturnq)! - fix: handle cjs dependencies of .marko templates

## 2.3.14

### Patch Changes

- [#46](https://github.com/marko-js/vite/pull/46) [`7808941`](https://github.com/marko-js/vite/commit/78089419b1d8477e574c3e239869ce4b3f76dca4) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Avoid using $global in internal templates.

## 2.3.13

### Patch Changes

- [#44](https://github.com/marko-js/vite/pull/44) [`5d7eba5`](https://github.com/marko-js/vite/commit/5d7eba562834363dff0b2bfe4efb09bf51b9fc9c) Thanks [@rturnq](https://github.com/rturnq)! - fix: windows paths

## 2.3.12

### Patch Changes

- [#42](https://github.com/marko-js/vite/pull/42) [`f3962a9`](https://github.com/marko-js/vite/commit/f3962a98cf645229bea150a54ce51353d1067ced) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue with hot module reloading virtual dependencies.

- [#42](https://github.com/marko-js/vite/pull/42) [`f3962a9`](https://github.com/marko-js/vite/commit/f3962a98cf645229bea150a54ce51353d1067ced) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue with new tags not discovered during HMR.

## 2.3.11

### Patch Changes

- [#40](https://github.com/marko-js/vite/pull/40) [`427c493`](https://github.com/marko-js/vite/commit/427c493c41a31eeff238c57f8050dbaeb137ebe8) Thanks [@rturnq](https://github.com/rturnq)! - Add store option for linked mode builds

## 2.3.10

### Patch Changes

- [#38](https://github.com/marko-js/vite/pull/38) [`743f9ae`](https://github.com/marko-js/vite/commit/743f9ae81baff9b1930c934e8f9a3aca68510d40) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Include vite 4 in peerDependency range.

## 2.3.9

### Patch Changes

- [#34](https://github.com/marko-js/vite/pull/34) [`571c993`](https://github.com/marko-js/vite/commit/571c99369d20163d8226e15f15cf9edc9a4bc63b) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Switch to purely using the mutation style for update config in the config hook.

## 2.3.8

### Patch Changes

- [#32](https://github.com/marko-js/vite/pull/32) [`5640120`](https://github.com/marko-js/vite/commit/56401202880c62b02f2569831265e4c478482ec3) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Avoid using `.load` api since it seems to cause an issue when there are many entry Marko files.

## 2.3.7

### Patch Changes

- [#30](https://github.com/marko-js/vite/pull/30) [`940dc22`](https://github.com/marko-js/vite/commit/940dc22bf1804723a9297b26b49b2fa112e86eab) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Avoid double resolving server entries and ensure that Marko import queries don't get passed through to other plugins

## 2.3.6

### Patch Changes

- [#28](https://github.com/marko-js/vite/pull/28) [`e8e2f68`](https://github.com/marko-js/vite/commit/e8e2f685d8c8f3a1861bf0da341d59f924741c7c) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix regression that caused an issue loading assets when used in dev mode.

## 2.3.5

### Patch Changes

- [#26](https://github.com/marko-js/vite/pull/26) [`4bbfafc`](https://github.com/marko-js/vite/commit/4bbfafc919deff2fc51f28317aae329905502330) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Avoid using fs readFile for browser entry. This allows virtual files to be browser entries.

## 2.3.4

### Patch Changes

- [#23](https://github.com/marko-js/vite/pull/23) [`2ad1d18`](https://github.com/marko-js/vite/commit/2ad1d1880a15cf94880fcce520b1fc4a2b6232d5) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix package.json version in repo.

## 2.0.3

### Patch Changes

- [#21](https://github.com/marko-js/vite/pull/21) [`31688b4`](https://github.com/marko-js/vite/commit/31688b4f9c48205570ba97fc8ef0cfbd9b54c1fc) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Improve support for Vite 3.

* [#21](https://github.com/marko-js/vite/pull/21) [`31688b4`](https://github.com/marko-js/vite/commit/31688b4f9c48205570ba97fc8ef0cfbd9b54c1fc) Thanks [@DylanPiercey](https://github.com/DylanPiercey)! - Fix issue with unlinked builds trying to render assets.

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.2](https://github.com/marko-js/vite/compare/v2.0.1...v2.0.2) (2021-09-03)

### [2.0.1](https://github.com/marko-js/vite/compare/v2.0.0...v2.0.1) (2021-09-02)

### Bug Fixes

- avoid adding invalid watchFiles ([0424677](https://github.com/marko-js/vite/commit/04246778e735971914679856a448e873979bab62))

## [2.0.0](https://github.com/marko-js/vite/compare/v1.3.2...v2.0.0) (2021-07-30)

### ⚠ BREAKING CHANGES

- requires a minimum Marko peer version of `^5.15.0`

### Features

- improve support for loading Marko files from node_modules ([c9d189f](https://github.com/marko-js/vite/commit/c9d189f48333aa04f6e997d80cce86afc86bead2))

### [1.3.2](https://github.com/marko-js/vite/compare/v1.3.1...v1.3.2) (2021-05-18)

### Bug Fixes

- issue with resolving nested entry paths ([e0b2dd4](https://github.com/marko-js/vite/commit/e0b2dd4a08ccc719782d19645e9385071369e2e6))

### [1.3.1](https://github.com/marko-js/vite/compare/v1.3.0...v1.3.1) (2021-05-03)

### Bug Fixes

- issue with loading missing virtual file in build mode ([493466e](https://github.com/marko-js/vite/commit/493466e0c08e012ef831f1adcf38a994d975dd27))

## [1.3.0](https://github.com/marko-js/vite/compare/v1.2.1...v1.3.0) (2021-05-03)

### Features

- handle adding/removing optional related files ([5756ad2](https://github.com/marko-js/vite/commit/5756ad224b6397630e4d936128bc4a9968cdcac0))

### [1.2.1](https://github.com/marko-js/vite/compare/v1.2.0...v1.2.1) (2021-04-30)

### Bug Fixes

- issue with common ids across multiple templates for entry files ([7633c9b](https://github.com/marko-js/vite/commit/7633c9bbf6198bb1ae33e86fc382ca8c4163d54f))

## 1.2.0 (2021-04-30)

### Features

- enable hmr ([8d3fca7](https://github.com/marko-js/vite/commit/8d3fca71b29c22cbf08f1b3d264f25b69fc4b670))
- initial release ([c4c1747](https://github.com/marko-js/vite/commit/c4c17471260fc8c1ea0640198fefd946a66a75be))

### Bug Fixes

- invalid entry id output in windows ([cbe9696](https://github.com/marko-js/vite/commit/cbe9696ca79d79a9d0541a61e61b82a9e1fa85eb))

## 1.1.0 (2021-04-28)

### Bug Fixes

- invalid entry id output in windows ([8db353f](https://github.com/marko-js/vite/commit/8db353f8d986df076dc89c2f23490f549d092330))

## 1.0.0 (2021-04-24)

### Features

- initial commit ([9204a9d](https://github.com/marko-js/vite/commit/9204a9d5112429d7b835caf431c46a32a2939776))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
