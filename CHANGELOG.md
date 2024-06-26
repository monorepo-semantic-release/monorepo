## [2.2.2](https://github.com/monorepo-semantic-release/monorepo/compare/v2.2.1...v2.2.2) (2024-05-31)


### Bug Fixes

* `0.10`(cast to 0.1) should greater than `0.9` ([eb492bf](https://github.com/monorepo-semantic-release/monorepo/commit/eb492bf84c33c8adfe641818676582e732570597))

## [2.2.1](https://github.com/monorepo-semantic-release/monorepo/compare/v2.2.0...v2.2.1) (2024-04-04)


### Bug Fixes

* update require-ci version support version greater than 9 ([0bd52f3](https://github.com/monorepo-semantic-release/monorepo/commit/0bd52f3c80c7ec21e87e28818e9fd354e22d2399))

# [2.2.0](https://github.com/monorepo-semantic-release/monorepo/compare/v2.1.1...v2.2.0) (2024-04-02)


### Features

* support update "require-ci" versions in composer.json ([e9dfc6f](https://github.com/monorepo-semantic-release/monorepo/commit/e9dfc6fb9655e324f38324d6f0e908f728f659d7))

## [2.1.1](https://github.com/monorepo-semantic-release/monorepo/compare/v2.1.0...v2.1.1) (2022-04-16)


### Bug Fixes

* `nextRelease` is undefined when sub package has no release ([d6d9596](https://github.com/monorepo-semantic-release/monorepo/commit/d6d9596479cc4f5449fb4663e89e0f133332cd39))

# [2.1.0](https://github.com/monorepo-semantic-release/monorepo/compare/v2.0.0...v2.1.0) (2022-04-16)


### Features

* update composer.lock if sub package has release ([ed36320](https://github.com/monorepo-semantic-release/monorepo/commit/ed36320a1a4182439ae47a2e7eea1674b6494b7e))
* update package version that defined in "repositories" key ([6f8dbe6](https://github.com/monorepo-semantic-release/monorepo/commit/6f8dbe6e759c8742ed1e45e40107e9c7a884a234))

# [2.0.0](https://github.com/monorepo-semantic-release/monorepo/compare/v1.1.1...v2.0.0) (2021-03-10)


### Bug Fixes

* ignore "form xxx" if not last release ([d57b79f](https://github.com/monorepo-semantic-release/monorepo/commit/d57b79f05bfc6dfd2f0c96bb2c20e9a9f1e478d7))
* missing pkg when pkg don't have dependency with other packages ([9f07183](https://github.com/monorepo-semantic-release/monorepo/commit/9f0718302bc2f26c1e9cf33917c3967e18debc65))
* use context.getNextVersion to calculate version ([719d272](https://github.com/monorepo-semantic-release/monorepo/commit/719d272671ae1b8255101da2bfd10a5aab1a6b44))
* use MIN_RELEASE instead of FIRST_RELEASE ([71a6394](https://github.com/monorepo-semantic-release/monorepo/commit/71a639470936487ba2ba5898f6d4c442ba394285))


### Code Refactoring

* rename `releaseType` to `releaseTypes`, prepare for multi release types support ([e54d791](https://github.com/monorepo-semantic-release/monorepo/commit/e54d791e1809e4d14b642e816c5140cca9c6ae51))


### Features

* add `sameVersions` config, use to keep groups of packages in same version ([f175d9f](https://github.com/monorepo-semantic-release/monorepo/commit/f175d9fa47ebbeb97989859d0e2077376e79679d))
* add notes for same version update when package dont have dependency notes ([c14a3da](https://github.com/monorepo-semantic-release/monorepo/commit/c14a3da2d17921873c2551636a79a3e378516349))
* format version text ([2b07e7c](https://github.com/monorepo-semantic-release/monorepo/commit/2b07e7c04a99161c13416cb604995469a48a2958))


### BREAKING CHANGES

* rename `releaseType` to `releaseTypes`
* `analyzeCommitsAll` now returns objects with `nextReleaseType` and `nextReleaseVersion` keys, instead of a string of release type.

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
