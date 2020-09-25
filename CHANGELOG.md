# [2.0.0-beta.5](https://github.com/monorepo-semantic-release/monorepo/compare/v2.0.0-beta.4...v2.0.0-beta.5) (2020-09-25)


### Bug Fixes

* ignore "form xxx" if not last release ([d57b79f](https://github.com/monorepo-semantic-release/monorepo/commit/d57b79f05bfc6dfd2f0c96bb2c20e9a9f1e478d7))

# [2.0.0-beta.4](https://github.com/monorepo-semantic-release/monorepo/compare/v2.0.0-beta.3...v2.0.0-beta.4) (2020-08-17)


### Bug Fixes

* use context.getNextVersion to calculate version ([719d272](https://github.com/monorepo-semantic-release/monorepo/commit/719d272671ae1b8255101da2bfd10a5aab1a6b44))
* use MIN_RELEASE instead of FIRST_RELEASE ([71a6394](https://github.com/monorepo-semantic-release/monorepo/commit/71a639470936487ba2ba5898f6d4c442ba394285))

# [2.0.0-beta.3](https://github.com/monorepo-semantic-release/monorepo/compare/v2.0.0-beta.2...v2.0.0-beta.3) (2020-07-17)


### Bug Fixes

* missing pkg when pkg don't have dependency with other packages ([9f07183](https://github.com/monorepo-semantic-release/monorepo/commit/9f0718302bc2f26c1e9cf33917c3967e18debc65))

# [2.0.0-beta.2](https://github.com/monorepo-semantic-release/monorepo/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2020-07-16)


### Code Refactoring

* rename `releaseType` to `releaseTypes`, prepare for multi release types support ([e54d791](https://github.com/monorepo-semantic-release/monorepo/commit/e54d791e1809e4d14b642e816c5140cca9c6ae51))


### Features

* add notes for same version update when package dont have dependency notes ([c14a3da](https://github.com/monorepo-semantic-release/monorepo/commit/c14a3da2d17921873c2551636a79a3e378516349))


### BREAKING CHANGES

* rename `releaseType` to `releaseTypes`

# [2.0.0-beta.1](https://github.com/monorepo-semantic-release/monorepo/compare/v1.1.1...v2.0.0-beta.1) (2020-07-15)


### Features

* add `sameVersions` config, use to keep groups of packages in same version ([f175d9f](https://github.com/monorepo-semantic-release/monorepo/commit/f175d9fa47ebbeb97989859d0e2077376e79679d))


### BREAKING CHANGES

* `analyzeCommitsAll` now returns objects with `nextReleaseType` and `nextReleaseVersion` keys, instead of a string of release type.

## [1.1.1](https://github.com/monorepo-semantic-release/monorepo/compare/v1.1.0...v1.1.1) (2020-07-13)


### Bug Fixes

* add empty line between title and content ([825ea7b](https://github.com/monorepo-semantic-release/monorepo/commit/825ea7b92614de3833937a44905c68895eea0f5c))

# [1.1.0](https://github.com/monorepo-semantic-release/monorepo/compare/v1.0.1...v1.1.0) (2020-07-13)


### Bug Fixes

* read package file from context.cwd ([1c61942](https://github.com/monorepo-semantic-release/monorepo/commit/1c61942875c391146a20e0ca696d68b232c92eee))
* return original config if package path dont have config file ([51d7747](https://github.com/monorepo-semantic-release/monorepo/commit/51d7747f0effd5377b6851c29760e124a1deaf4f))


### Features

* support `follow-major` releaseType ([77b1616](https://github.com/monorepo-semantic-release/monorepo/commit/77b16167e61bf334b5612a4f3c312dc6adbecd9b))
* support `follow` releaseType ([2af6f78](https://github.com/monorepo-semantic-release/monorepo/commit/2af6f7839e2b66fc4808b2a0e672c18f6b8b6789))

## [1.0.1](https://github.com/monorepo-semantic-release/monorepo/compare/v1.0.0...v1.0.1) (2020-07-08)


### Bug Fixes

* change pkgContexts from array to object ([008d0a7](https://github.com/monorepo-semantic-release/monorepo/commit/008d0a778551b081eef367746058bdb05553f53c))

# 1.0.0 (2020-07-03)


### Features

* init ([33af704](https://github.com/monorepo-semantic-release/monorepo/commit/33af7045a698d8b92f474d19641b20b6ad477c36))
