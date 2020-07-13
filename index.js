const fs = require('fs');
const path = require('path');
const {uniq, forEach, keyBy, mapValues} = require('lodash');
const stringifyPackage = require('stringify-package');
const toposort = require('toposort');
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline')

function encodeName(name) {
  return '@' + name;
}

function decodeName(name) {
  return name.substr(1);
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

          graph.push([pkgs[name], pkg]);
          pkg.dependencies.push({file, key, name});
        });
      });
    });
  });

  if (graph.length) {
    pkgs = keyBy(toposort(graph), 'name');
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

async function initPkgs(pluginConfig, context) {
  let pkgs = readPkgFiles(context, pkgConfigs);
  pkgs = updateDependencies(pkgs, pkgConfigs);
  return pkgs;
}

async function analyzeCommitsAll(pluginConfig, context) {
  const {releaseType} = pluginConfig;
  const {pkgContexts} = context;

  forEach(pkgContexts, (pkgContext) => {
    if (pkgContext.nextReleaseType) {
      return;
    }

    // Update package version if dependency was updated
    pkgContext.pkg.dependencies.forEach(({name}) => {
      if (pkgContexts[name].nextReleaseType) {
        pkgContexts[pkgContext.name].nextReleaseType = getReleaseType(releaseType, pkgContexts[name].nextReleaseType);
        return false;
      }
    });
  });

  return mapValues(pkgContexts, 'nextReleaseType');
}

async function generateNotes(pluginConfig, context) {
  const {pkg, pkgContexts} = context;

  let notes = [
    '### Dependencies',
    '',
  ];

  pkg.dependencies.forEach(({name}) => {
    if (pkgContexts[name].nextRelease && pkgContexts[name].nextRelease.version) {
      notes.push(`* **${name}:** upgrade to ${pkgContexts[name].nextRelease.version}`);
    }
  });

  // Remove duplicate notes from different packages
  return notes.length > 2 ? uniq(notes).join('\n') : null;
}

async function prepare(pluginConfig, context) {
  const {cwd, logger, options, pkg, pkgs, pkgContexts} = context;

  // Update self package version, such as package.json
  forEach(pkg.pkgFiles, pkgFile => {
    if (pkgFile.content.version) {
      pkgFile.content.version = context.nextRelease.version;
    }
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

module.exports = {initPkgs, analyzeCommitsAll, generateNotes, prepare};