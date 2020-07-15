const test = require('ava');
const clearModule = require('clear-module');
const {stub} = require('sinon');
const tempy = require('tempy');
const {outputFile} = require('fs-extra');
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
      '@test/base': '^1.0.0'
    }
  }));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base'
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1'
    }
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
          newline: undefined
        }
      }
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'package.json', key: 'dependencies', name: '@test/base'}
      ],
      pkgFiles: {
        'package.json': {
          content: {
            name: '@test/pkg1',
            dependencies: {'@test/base': '^1.0.0'}
          },
          indent: 0,
          newline: undefined
        }
      }
    }
  });
});

test('Init packages from composer.json', async t => {
  const cwd = tempy.directory();

  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/package.json'), JSON.stringify({
    name: '@test/pkg1',
    dependencies: {
      '@test/base': '^1.0.0'
    }
  }));

  await outputFile(path.resolve(cwd, 'packages/base/composer.json'), JSON.stringify({name: 'test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/composer.json'), JSON.stringify({
    name: 'test/pkg1',
    require: {
      'test/base': '^1.0.0'
    }
  }));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base'
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1'
    }
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
          newline: undefined
        },
        'composer.json': {
          content: {name: 'test/base'},
          indent: 0,
          newline: undefined
        }
      }
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'package.json', key: 'dependencies', name: '@test/base'},
        {file: 'composer.json', key: 'require', name: '@test/base'}
      ],
      pkgFiles: {
        'package.json': {
          content: {
            name: '@test/pkg1',
            dependencies: {'@test/base': '^1.0.0'}
          },
          indent: 0,
          newline: undefined
        },
        'composer.json': {
          content: {
            name: 'test/pkg1',
            require: {'test/base': '^1.0.0'}
          },
          indent: 0,
          newline: undefined
        }
      }
    }
  });
});

test('Init packages from package.json and composer.json', async t => {
  const cwd = tempy.directory();
  await outputFile(path.resolve(cwd, 'packages/base/composer.json'), JSON.stringify({name: 'test/base'}));
  await outputFile(path.resolve(cwd, 'packages/pkg1/composer.json'), JSON.stringify({
    name: 'test/pkg1',
    require: {
      'test/base': '^1.0.0'
    }
  }));

  const pkgs = {
    'base': {
      name: 'base',
      path: 'packages/base'
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1'
    }
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
          newline: undefined
        }
      }
    },
    '@test/pkg1': {
      name: '@test/pkg1',
      path: 'packages/pkg1',
      dependencies: [
        {file: 'composer.json', key: 'require', name: '@test/base'}
      ],
      pkgFiles: {
        'composer.json': {
          content: {
            name: 'test/pkg1',
            require: {'test/base': '^1.0.0'}
          },
          indent: 0,
          newline: undefined
        }
      }
    }
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
      path: 'packages/pkg1'
    }
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
    }
  });
});

test('Init packages with one package dont have config file', async t => {
  const cwd = tempy.directory();
  await outputFile(path.resolve(cwd, 'packages/base/package.json'), JSON.stringify({name: '@test/base'}));

  const pkgs = {
    '@test/base': {
      name: '@test/base',
      path: 'packages/base'
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1'
    }
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
          newline: undefined
        }
      }
    },
    'pkg1': {
      name: 'pkg1',
      path: 'packages/pkg1',
      dependencies: [],
      pkgFiles: {},
    }
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
          }
        ],
      }
    }
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {
    '@test/base': {nextReleaseType: 'patch'},
    '@test/pkg1': {nextReleaseType: 'patch'}
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
          }
        ],
      }
    },
    '@test/pkg2': {
      name: '@test/pkg2',
      pkg: {
        dependencies: [
          {
            name: '@test/pkg1',
          }
        ],
      }
    }
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
          }
        ],
      }
    }
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {'@test/base': {}, '@test/pkg1': {}});
});

async function releaseTypeMacro(t, config, baseReleaseType, pkgReleaseType) {
  const pluginConfig = {
    releaseType: config
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
          }
        ],
      }
    }
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
        }
      ],
    }
  }

  const pkgContexts = {
    '@test/base': pkgBaseContext,
    '@test/pkg1': pkg1Context,
  };
  const context = {
    pkg: pkg1Context.pkg,
    pkgContexts
  };

  const notes = await t.context.m.generateNotes(pluginConfig, context);

  t.is(notes, '### Dependencies\n\n* **@test/base:** upgrade to 2.0.0');
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
        }
      ],
    }
  }

  const pkgContexts = {
    '@test/base': pkgBaseContext,
    '@test/pkg1': pkg1Context,
  };
  const context = {
    pkg: pkg1Context.pkg,
    pkgContexts
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
      ]
    ]
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
        version: '2.0.0'
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
        version: '1.0.0'
      },
      pkg: {
        dependencies: [],
      }
    }
  };

  const result = await t.context.m.analyzeCommitsAll(pluginConfig, {pkgContexts});

  t.deepEqual(result, {
    '@test/base': {nextReleaseType: 'patch', nextReleaseVersion: '2.0.1'},
    '@test/pkg1': {nextReleaseType: 'patch', nextReleaseVersion: '2.0.1'}
  });
});