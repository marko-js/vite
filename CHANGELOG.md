# Changelog

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
