const test = require('ava');
const clearModule = require('clear-module');
const {stub} = require('sinon');
const tempy = require('tempy');
const {outputFile, readJsonSync} = require('fs-extra');
const path = require('path');

test.beforeEach(t => {
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = require('..');
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Init packages from packages.json', async t => {
  const cwd = tempy.directory();
  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/package.json'), JSON.stringify({
    name: '@test/pkg1',
    dependencies: {
      '@test/base': '^1.0.0',
    },
  }));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  t.deepEqual(initPkgs, {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
      dependencies: [],
      pkgFiles: {
        'package.json': {
          content: {name: '@test/base'},
          indent: 0,
          newline: undefined,
        },
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'package.json', key: 'dependencies', name: '@test/base'},
      ],
      pkgFiles: {
        'package.json': {
          content: {
            name: '@test/pkg1',
            dependencies: {'@test/base': '^1.0.0'},
          },
          indent: 0,
          newline: undefined,
        },
      },
    },
  });
});

test('Init packages from composer.json', async t => {
  const cwd = tempy.directory();

  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/package.json'), JSON.stringify({
    name: '@test/pkg1',
    dependencies: {
      '@test/base': '^1.0.0',
    },
  }));

  await outputFile(path.resolve(cwd, 'packages/base/composer.json'), JSON.stringify({name: 'test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/composer.json'), JSON.stringify({
    name: 'test/pkg1',
    require: {
      'test/base': '^1.0.0',
    },
  }));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  t.deepEqual(initPkgs, {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
      dependencies: [],
      pkgFiles: {
        'package.json': {
          content: {name: '@test/base'},
          indent: 0,
          newline: undefined,
        },
        'composer.json': {
          content: {name: 'test/base'},
          indent: 0,
          newline: undefined,
        },
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'package.json', key: 'dependencies', name: '@test/base'},
        {file: 'composer.json', key: 'require', name: '@test/base'},
      ],
      pkgFiles: {
        'package.json': {
          content: {
            name: '@test/pkg1',
            dependencies: {'@test/base': '^1.0.0'},
          },
          indent: 0,
          newline: undefined,
        },
        'composer.json': {
          content: {
            name: 'test/pkg1',
            require: {'test/base': '^1.0.0'},
          },
          indent: 0,
          newline: undefined,
        },
      },
    },
  });
});

test('Init packages from package.json and composer.json', async t => {
  const cwd = tempy.directory();
  await outputFile(path.resolve(cwd, 'packages/base/composer.json'), JSON.stringify({name: 'test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/composer.json'), JSON.stringify({
    name: 'test/pkg1',
    require: {
      'test/base': '^1.0.0',
    },
  }));

  const pkgs = {
    'base': {
      name: 'base',
      path: 'packages/base',
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  t.deepEqual(initPkgs, {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
      dependencies: [],
      pkgFiles: {
        'composer.json': {
          content: {name: 'test/base'},
          indent: 0,
          newline: undefined,
        },
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'composer.json', key: 'require', name: '@test/base'},
      ],
      pkgFiles: {
        'composer.json': {
          content: {
            name: 'test/pkg1',
            require: {'test/base': '^1.0.0'},
          },
          indent: 0,
          newline: undefined,
        },
      },
    },
  });
});

test('Init packages without packages.json or composer.json', async t => {
  const cwd = tempy.directory();

  const pkgs = {
    'base': {
      name: 'base',
      path: 'packages/base',
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  t.deepEqual(initPkgs, {
    'base': {
      name: 'base',
      path: 'packages/base',
      dependencies: [],
      pkgFiles: {},
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1',
      dependencies: [],
      pkgFiles: {},
    },
  });
});

test('Init packages with one package dont have config file', async t => {
  const cwd = tempy.directory();
  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  t.deepEqual(initPkgs, {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
      dependencies: [],
      pkgFiles: {
        'package.json': {
          content: {name: '@test/base'},
          indent: 0,
          newline: undefined,
        },
      },
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1',
      dependencies: [],
      pkgFiles: {},
    },
  });
});

test('Init packages without dependencies', async t => {
  const cwd = tempy.directory();
  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/package.json'), JSON.stringify({
    name: '@test/pkg1',
    dependencies: {
      '@test/base': '^1.0.0',
    },
  }));
  await outputFile(path.resolve(cwd, 'packages/pkg2/package.json'), JSON.stringify({name: '@test/pkg2'}));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
    },
    '@test/pkg2': {
      name: '@test/pkg2',
      path: 'packages/pkg2',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  t.deepEqual(initPkgs, {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
      dependencies: [],
      pkgFiles: {
        'package.json': {
          content: {name: '@test/base'},
          indent: 0,
          newline: undefined,
        },
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'package.json', key: 'dependencies', name: '@test/base'},
      ],
      pkgFiles: {
        'package.json': {
          content: {
            name: '@test/pkg1',
            dependencies: {'@test/base': '^1.0.0'},
          },
          indent: 0,
          newline: undefined,
        },
      },
    },
    '@test/pkg2': {
      name: '@test/pkg2',
      path: 'packages/pkg2',
      dependencies: [],
      pkgFiles: {
        'package.json': {
          content: {name: '@test/pkg2'},
          indent: 0,
          newline: undefined,
        },
      },
    },
  });
});

test('Set release type if dependency has new release', async t => {
  const pluginConfig = {};
  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      nextReleaseType: 'patch',
      pkg: {
        dependencies: [],
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      pkg: {
        dependencies: [
          {
            name: '@test/base',
          },
        ],
      },
    },
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {
    '@test/base': {nextReleaseType: 'patch'},
    '@test/pkg1': {nextReleaseType: 'patch'},
  });
});

test('Set release type if parent dependency has new release', async t => {
  const pluginConfig = {};
  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      nextReleaseType: 'patch',
      pkg: {
        dependencies: [],
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      pkg: {
        dependencies: [
          {
            name: '@test/base',
          },
        ],
      },
    },
    '@test/pkg2': {
      name: '@test/pkg2',
      pkg: {
        dependencies: [
          {
            name: '@test/pkg1',
          },
        ],
      },
    },
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {
    '@test/base': {nextReleaseType: 'patch'},
    '@test/pkg1': {nextReleaseType: 'patch'},
    '@test/pkg2': {nextReleaseType: 'patch'},
  });
});

test('Dont set next release type if dependency doesnt have new release', async t => {
  const pluginConfig = {};
  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      pkg: {
        dependencies: [],
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      pkg: {
        dependencies: [
          {
            name: '@test/base',
          },
        ],
      },
    },
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {'@test/base': {}, '@test/pkg1': {}});
});

async function releaseTypeMacro(t, config, baseReleaseType, pkgReleaseType) {
  const pluginConfig = {
    releaseTypes: config,
  };
  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      nextReleaseType: baseReleaseType,
      pkg: {
        dependencies: [],
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      pkg: {
        dependencies: [
          {
            name: '@test/base',
          },
        ],
      },
    },
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {
    '@test/base': {nextReleaseType: baseReleaseType},
    '@test/pkg1': {nextReleaseType: pkgReleaseType},
  });
};

releaseTypeMacro.title = (releaseType, releaseType2, basePlgReleaseType) => `Release type: ${releaseType}, base package release type: ${basePlgReleaseType}`;

test('follow', releaseTypeMacro, 'follow', 'patch', 'patch');
test('follow', releaseTypeMacro, 'follow', 'minor', 'minor');
test('follow', releaseTypeMacro, 'follow', 'major', 'major');
test('follow-major', releaseTypeMacro, 'follow-major', 'patch', 'patch');
test('follow-major', releaseTypeMacro, 'follow-major', 'minor', 'patch');
test('follow-major', releaseTypeMacro, 'follow-major', 'major', 'major');

test('Add dependencies notes to changelog if dependency have next release', async t => {
  const pluginConfig = {};
  const pkgBaseContext = {
    name: '@test/base',
    lastRelease: {
      version: '1.0.0',
    },
    nextRelease: {
      version: '2.0.0',
    },
    pkg: {
      dependencies: [],
    },
  };
  const pkg1Context = {
    name: '@test/pkg1',
    pkg: {
      dependencies: [
        {
          name: '@test/base',
        },
      ],
    },
  };

  const pkgContexts = {
    '@test/base': pkgBaseContext,
    '@test/pkg1': pkg1Context,
  };
  const context = {
    pkg: pkg1Context.pkg,
    pkgContexts,
    options: {},
    commits: [{message: 'test'}],
  };

  const notes = await t.context.m.generateNotes(pluginConfig, context);

  t.is(notes, '### Dependencies\n\n* **@test/base:** upgrade from `1.0.0` to `2.0.0`');
});

test('Add dependencies notes to changelog without last release', async t => {
  const pluginConfig = {};
  const pkgBaseContext = {
    name: '@test/base',
    lastRelease: {},
    nextRelease: {
      version: '1.0.0',
    },
    pkg: {
      dependencies: [],
    },
  };
  const pkg1Context = {
    name: '@test/pkg1',
    pkg: {
      dependencies: [
        {
          name: '@test/base',
        },
      ],
    },
  };

  const pkgContexts = {
    '@test/base': pkgBaseContext,
    '@test/pkg1': pkg1Context,
  };
  const context = {
    pkg: pkg1Context.pkg,
    pkgContexts,
    options: {},
    commits: [{message: 'test'}],
  };

  const notes = await t.context.m.generateNotes(pluginConfig, context);

  t.is(notes, '### Dependencies\n\n* **@test/base:** upgrade to `1.0.0`');
});

test('Dont add dependencies notes to changelog if dependency doesnt have next release', async t => {
  const pluginConfig = {};
  const pkgBaseContext = {
    name: '@test/base',
    pkg: {
      dependencies: [],
    },
  };
  const pkg1Context = {
    name: '@test/pkg1',
    pkg: {
      dependencies: [
        {
          name: '@test/base',
        },
      ],
    },
  };

  const pkgContexts = {
    '@test/base': pkgBaseContext,
    '@test/pkg1': pkg1Context,
  };
  const context = {
    pkg: pkg1Context.pkg,
    pkgContexts,
    options: {},
    commits: [{message: 'test'}],
    lastRelease: {},
    nextRelease: {},
  };

  const notes = await t.context.m.generateNotes(pluginConfig, context);

  t.is(notes, null);
});

test('Update package to same version if the other is updated', async t => {
  const pluginConfig = {
    sameVersions: [
      [
        '@test/base',
        '@test/pkg1',
      ],
    ],
  };

  const logger = {
    log: stub(),
  };

  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      nextReleaseType: 'patch',
      branch: {},
      logger,
      lastRelease: {
        version: '2.0.0',
      },
      pkg: {
        dependencies: [],
      },
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      nextReleaseType: 'patch',
      branch: {},
      logger,
      lastRelease: {
        version: '1.0.0',
      },
      pkg: {
        dependencies: [],
      },
    },
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts, getNextVersion: () => '2.0.1'});

  t.deepEqual(result, {
    '@test/base': {nextReleaseType: 'patch', nextReleaseVersion: '2.0.1'},
    '@test/pkg1': {nextReleaseType: 'patch', nextReleaseVersion: '2.0.1'},
  });
});

test('Update composer repositories version', async t => {
  const cwd = tempy.directory();

  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));
  await outputFile(path.resolve(cwd, 'package.json'), JSON.stringify({
    name: '@test/test',
    dependencies: {
      '@test/base': '^1.0.0',
    },
  }));

  await outputFile(path.resolve(cwd, 'packages/base/composer.json'), JSON.stringify({name: 'test/base'}));
  await outputFile(path.resolve(cwd, 'composer.json'), JSON.stringify({
    name: 'test/test',
    require: {
      'test/base': '^1.0.0',
    },
    "repositories": [
      {
        "type": "path",
        "url": "plugins/*",
        "options": {
          "versions": {
            "test/base": "1.0.0",
          },
        },
      },
    ],
  }));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
    },
    '@test/test': {
      name: '@test/test',
      path: '.',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      nextReleaseType: 'minor',
      nextRelease: {
        version: '1.2.0',
      },
      pkg: {
        dependencies: [],
      },
    },
  };

  await t.context.m.prepare({}, {
    cwd,
    logger: {
      log: stub(),
    },
    pkg: initPkgs['@test/test'],
    pkgContexts,
    options: {},
    nextRelease: {
      version: '1.1.0',
    },
  });

  t.deepEqual(await readJsonSync(path.resolve(cwd, 'composer.json')), {
    name: 'test/test',
    require: {
      'test/base': '^1.2.0',
    },
    "repositories": [
      {
        "type": "path",
        "url": "plugins/*",
        "options": {
          "versions": {
            "test/base": "1.2.0",
          },
        },
      },
    ],
  });
});

test('Update composer.lock', async t => {
  const pluginConfig = {};
  const pkgBaseContext = {
    name: '@test/base',
    lastRelease: {
      version: '1.0.0',
    },
    nextRelease: {
      version: '2.0.0',
    },
    pkg: {
      dependencies: [],
    },
  };
  const pkg1Context = {
    name: '@test/pkg1',
    pkg: {
      dependencies: [
        {
          name: '@test/base',
        },
      ],
    },
  };

  const pkgContexts = {
    '@test/base': pkgBaseContext,
    '@test/pkg1': pkg1Context,
  };
  
  const logs = [];
  const context = {
    pkg: pkg1Context.pkg,
    pkgContexts,
    options: {},
    logger: {
      log: (msg) => {
        logs.push(msg);
      }
    },
    commits: [{message: 'test'}],
  };

  await t.context.m.prepareAll(pluginConfig, context);
  t.deepEqual(logs.length, 1);
});

async function requireCiMacro(t, lastVersion, lastAs, nextReleaseType, nextReleaseVersion, nextAs) {
  const cwd = tempy.directory();

  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));
  await outputFile(path.resolve(cwd, 'package.json'), JSON.stringify({
    name: '@test/test',
    dependencies: {
      '@test/base': '^1.0.0',
    },
  }));

  await outputFile(path.resolve(cwd, 'packages/base/composer.json'), JSON.stringify({name: 'test/base'}));
  await outputFile(path.resolve(cwd, 'composer.json'), JSON.stringify({
    name: 'test/test',
    require: {
      'test/base': '^' + lastVersion,
    },
    "extra": {
      "require-ci": {
        "test/base": "github-test/base as " + lastAs + "-dev"
      }
    }
  }));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base',
    },
    '@test/test': {
      name: '@test/test',
      path: '.',
    },
  };

  const initPkgs = await t.context.m.initPkgs({}, {cwd, pkgs});

  const pkgContexts = {
    '@test/base': {
      name: '@test/base',
      nextReleaseType: nextReleaseType,
      nextRelease: {
        version: nextReleaseVersion,
      },
      pkg: {
        dependencies: [],
      },
    },
  };

  await t.context.m.prepare({}, {
    cwd,
    logger: {
      log: stub(),
    },
    pkg: initPkgs['@test/test'],
    pkgContexts,
    options: {},
    nextRelease: {
      version: '1.1.0',
    },
  });

  t.deepEqual(await readJsonSync(path.resolve(cwd, 'composer.json')), {
    name: 'test/test',
    require: {
      'test/base': '^' + nextReleaseVersion,
    },
    "extra": {
      "require-ci": {
        "test/base": "github-test/base as " + nextAs + "-dev"
      }
    }
  });
};

requireCiMacro.title = (t, lastVersion, lastAs, nextReleaseType, nextReleaseVersion, nextAs) => `Next version ${nextReleaseVersion}, next as ${nextAs}`;

test(requireCiMacro, '1.0.0', '1.x', 'major', '2.0.0', '2.x');
test(requireCiMacro, '1.0.0', '1.x', 'minor', '1.1.0', '1.x');
test(requireCiMacro, '1.0.0', '1.x', 'patch', '1.0.1', '1.x');
test(requireCiMacro, '10.0.0', '10.x', 'major', '11.0.0', '11.x');
test(requireCiMacro, '0.1.0', '0.1.x', 'major', '0.2.0', '0.2.x');
test(requireCiMacro, '0.1.0', '0.1.x', 'minor', '0.1.1', '0.1.x');
