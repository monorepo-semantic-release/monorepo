const fs = require('fs');
const path = require('path');
const {uniq, forEach, keyBy, mapValues, template} = require('lodash');
const stringifyPackage = require('stringify-package');
const toposort = require('toposort');
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline');
const semver = require('semver');
const execa = require('execa');
const debug = require('debug')('semantic-release:monorepo');
const MIN_RELEASE = '0.0.0-0';

function encodeName(name) {
  return '@' + name;
}

function decodeName(name) {
  return name.substr(1);
}

/**
 * Convert 0.9.1 to 0.9, 1.1.0 to 1
 */
function getMainVersion(version) {
  if (version.substring(0, 1) === '0') {
    return version.substring(0, 3);
  } else {
    return version.substring(0, 1);
  }
}

const pkgConfigs = {
  'package.json': {
    keys: [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ],
    encodeName: name => name,
    decodeName: name => name,
  },
  'composer.json': {
    keys: [
      'require',
      'require-dev',
    ],
    encodeName,
    decodeName,
  }
};

function readPkgFiles(context, pkgConfigs) {
  const {cwd} = context;

  let pkgs = {};
  for (let [name, pkg] of Object.entries(context.pkgs)) {
    pkg = {
      ...pkg,
      dependencies: [],
      pkgFiles: {},
    }

    let found = false;
    for (const [pkgFileName, pkgConfig] of Object.entries(pkgConfigs)) {
      const file = path.join(cwd, pkg.path, pkgFileName);
      if (!fs.existsSync(file)) {
        continue;
      }

      found = true;

      const content = fs.readFileSync(file).toString();
      const json = JSON.parse(content);

      // TODO check all package name is same
      const name = pkgConfig.encodeName(json.name);
      pkg.name = name;
      pkg.pkgFiles[pkgFileName] = {
        content: json,
        indent: detectIndent(content).amount,
        newline: detectNewline(content),
      };
      pkgs[name] = pkg;
    }

    // Fallback to original config
    if (!found) {
      pkgs[name] = pkg;
    }
  }
  return pkgs;
}

function updateDependencies(pkgs, pkgConfigs) {
  let graph = [];
  forEach(pkgs, (pkg) => {
    let found = false;
    forEach(pkgConfigs, (config, file) => {
      if (!pkg.pkgFiles || !pkg.pkgFiles[file]) {
        return;
      }

      const pkgFile = pkg.pkgFiles[file];
      config.keys.forEach(key => {
        if (!pkgFile.content[key]) {
          return;
        }

        forEach(pkgFile.content[key], (version, name) => {
          name = config.encodeName(name);

          if (!pkgs[name]) {
            return;
          }

          found = true;
          graph.push([pkgs[name], pkg]);
          pkg.dependencies.push({file, key, name});
        });
      });
    });

    if (!found) {
      graph.push([pkg]);
    }
  });

  if (graph.length) {
    pkgs = keyBy(toposort(graph).filter(Boolean), 'name');
  }

  return pkgs;
}

function getReleaseType(config, nextReleaseType) {
  switch (config) {
    case 'follow':
      return nextReleaseType;

    case 'follow-major':
      return nextReleaseType === 'major' ? 'major' : 'patch';

    case 'patch':
    default:
      return 'patch';
  }
}

/**
 * Update package version that defined in "repositories" key
 * 
 * @link https://getcomposer.org/doc/05-repositories.md#path
 */
function updateComposerVersions(content, pkgContexts) {
  if (!content.repositories) {
    return;
  }
  
  for (const i in content.repositories) {
    const repository = content.repositories[i];
    if (!repository || !repository.options || !repository.options.versions) {
      continue;
    }

    for (const name in repository.options.versions) {
      const encodedName = encodeName(name);
      if (pkgContexts[encodedName] && pkgContexts[encodedName].nextRelease) {
        repository.options.versions[name] = pkgContexts[encodedName].nextRelease.version;
      }
    }
  }
};

function updateComposerRequireCi(content, pkgContexts) {
  if (!content.extra || !content.extra['require-ci']) {
    return;
  }

  // Format like {"vendor/name": "user/repo as 0.9.x-dev"}
  const requireCi = content.extra['require-ci'];
  for (const name in requireCi) {
    const value = requireCi[name];
    const encodedName = encodeName(name);
    if (!pkgContexts[encodedName] || !pkgContexts[encodedName].nextRelease) {
      continue;
    }

    const nextVersion = pkgContexts[encodedName].nextRelease.version;
    const nextMainVersion = getMainVersion(nextVersion);

    // Format like "vendor/name as 0.9.x-dev"
    const [githubName, version] = value.split(' as ');
    const [mainVersion] = version.split('.x-dev');

    debug('Compare require-ci version', nextVersion, value);
    if (nextMainVersion > mainVersion) {
      requireCi[name] = githubName + ' as ' + nextMainVersion + '.x-dev';
      debug('Change require-ci to', name, requireCi[name]);
    }
  }
}

async function initPkgs(pluginConfig, context) {
  let pkgs = readPkgFiles(context, pkgConfigs);
  pkgs = updateDependencies(pkgs, pkgConfigs);
  return pkgs;
}

async function analyzeCommitsAll(pluginConfig, context) {
  const {releaseTypes, sameVersions = []} = pluginConfig;
  const {pkgContexts} = context;
  const result = mapValues(pkgContexts, () => ({}));

  forEach(pkgContexts, (pkgContext) => {
    if (pkgContext.nextReleaseType) {
      result[pkgContext.name].nextReleaseType = pkgContext.nextReleaseType;
      return;
    }

    // Update package version if dependency was updated
    pkgContext.pkg.dependencies.forEach(({name}) => {
      if (pkgContexts[name].nextReleaseType) {
        result[pkgContext.name].nextReleaseType = pkgContexts[pkgContext.name].nextReleaseType = getReleaseType(releaseTypes, pkgContexts[name].nextReleaseType);
        return false;
      }
    });
  });

  sameVersions.forEach((pkgs) => {
    const hasRelease = pkgs.find(pkg => pkgContexts[pkg].nextReleaseType);
    if (!hasRelease) {
      return;
    }

    const highestVersion = pkgs.reduce((highestVersion, pkg) => {
      const pkgContext = pkgContexts[pkg];
      if (!pkgContext.nextReleaseType) {
        return highestVersion;
      }

      const nextReleaseVersion = context.getNextVersion({
        ...pkgContext,
        nextRelease: {
          type: pkgContext.nextReleaseType,
          channel: pkgContext.branch.channel || null,
        },
      });

      return semver.gt(highestVersion, nextReleaseVersion) ? highestVersion : nextReleaseVersion;
    }, MIN_RELEASE);

    pkgs.forEach(pkg => {
      result[pkg].nextReleaseVersion = highestVersion;
    });
  });

  return result;
}

async function generateNotes(pluginConfig, context) {
  const {sameVersions = []} = pluginConfig;
  const {options, pkg, pkgContexts, commits, nextRelease} = context;

  let notes = [
    '### Dependencies',
    '',
  ];

  const tpl = template(`* **\${name}:** upgrade\${lastRelease.version ? (' from \`' + lastRelease.version + '\`') : ''} to \`\${nextRelease.version}\``);
  pkg.dependencies.forEach(({name}) => {
    if (pkgContexts[name].nextRelease && pkgContexts[name].nextRelease.version) {
      notes.push(tpl({
        name,
        lastRelease: pkgContexts[name].lastRelease,
        nextRelease: pkgContexts[name].nextRelease
      }));
    }
  });

  if (options.versionMode !== 'fixed' && !commits.length && notes.length === 2) {
    notes.push(template(`* upgrade to \${version} with packages: \${packages}`)({
      version: nextRelease.version,
      packages: sameVersions.find(pkgs => pkgs.includes(context.name))
        .filter(pkg => pkg !== context.name)
        .join(', '),
    }));
  }

  // Remove duplicate notes from different packages
  return notes.length > 2 ? uniq(notes).join('\n') : null;
}

async function prepare(pluginConfig, context) {
  const {cwd, logger, options, pkg, pkgContexts} = context;

  forEach(pkg.pkgFiles, pkgFile => {
    // Update self package version, such as package.json
    if (pkgFile.content.version) {
      pkgFile.content.version = context.nextRelease.version;
    }

    updateComposerVersions(pkgFile.content, pkgContexts);
    updateComposerRequireCi(pkgFile.content, pkgContexts);
  });

  // Update dependency versions
  pkg.dependencies.forEach(({file, key, name}) => {
    const {content} = pkg.pkgFiles[file];
    if (pkgContexts[name].nextRelease && pkgContexts[name].nextRelease.version) {
      content[key][pkgConfigs[file].decodeName(name)] = '^' + pkgContexts[name].nextRelease.version;
    }
  });

  logger.log('Write package in %s with version %O', pkg.path, context.nextRelease.version);
  if (!options.dryRun) {
    forEach(pkg.pkgFiles, ({content, indent, newline}, name) => {
      fs.writeFileSync(path.join(cwd, name), stringifyPackage(content, indent, newline));
    });
  }
}

async function prepareAll(pluginConfig, context) {
  const {logger, pkgContexts} = context;

  const names = [];
  for (const name in pkgContexts) {
    if (
      pkgContexts[name].nextRelease
      // Ignore main package
      && pkgContexts[name].pkg.path !== '.'
    ) {
      names.push(decodeName(name));
    }
  }
  if (names.length === 0) {
    return;
  }

  try {
    const result = await execa('composer', ['update', '--no-install', ...names]);
    logger.log('Run composer result: ', result.stderr);
  } catch (error) {
    logger.log('Fail to update composer.lock: ', error);
  }
}

module.exports = {initPkgs, analyzeCommitsAll, generateNotes, prepare, prepareAll};