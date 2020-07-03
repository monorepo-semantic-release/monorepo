const fs = require('fs');
const path = require('path');
const {uniq, forEach, keyBy} = require('lodash');
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
  let pkgs = {};
  for (let pkg of Object.values(context.pkgs)) {
    pkg = {
      ...pkg,
      dependencies: [],
      pkgFiles: {},
    }

    for (const [pkgFileName, pkgConfig] of Object.entries(pkgConfigs)) {
      if (!fs.existsSync(path.join(pkg.path, pkgFileName))) {
        continue;
      }

      const content = fs.readFileSync(path.join(pkg.path, pkgFileName)).toString();
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
  }
  return pkgs;
}

function updateDependencies(pkgs, pkgConfigs) {
  let graph = [];
  forEach(pkgs, (pkg) => {
    forEach(pkgConfigs, (config, file) => {
      if (!pkg.pkgFiles[file]) {
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

async function initPkgs(pluginConfig, context) {
  let pkgs = readPkgFiles(context, pkgConfigs);
  pkgs = updateDependencies(pkgs, pkgConfigs);
  return pkgs;
}

async function analyzeCommitsAll(pluginConfig, context) {
  context.pkgContexts.forEach(pkgContext => {
    if (pkgContext.nextReleaseType) {
      return false;
    }

    // Update package version if dependency was updated
    pkgContext.pkg.dependencies.forEach(({name}) => {
      if (!pkgContext.pkgs[name].nextRelease) {
        return;
      }

      if (pkgContext.pkgs[name].nextRelease.type) {
        pkgContext.nextReleaseType = 'patch';
        return false;
      }
    });
  });
}

async function generateNotes(pluginConfig, context) {
  const {pkg, pkgs} = context;

  let notes = [
    '### Dependencies',
  ];

  pkg.dependencies.forEach(({name}) => {
    if (pkgs[name].nextRelease && pkgs[name].nextRelease.version) {
      notes.push(`* **${name}:** upgraded to ${pkgs[name].nextRelease.version}`);
    }
  });

  // Remove duplicate notes from different packages
  return notes.length > 1 ? uniq(notes).join('\n') : null;
}

async function prepare(pluginConfig, context) {
  const {cwd, logger, options, pkg, pkgs} = context;

  // Update self package version, such as package.json
  forEach(pkg.pkgFiles, pkgFile => {
    if (pkgFile.version) {
      pkgFile.version = pkg.nextRelease.version;
    }
  });

  // Update dependency versions
  pkg.dependencies.forEach(({file, key, name}) => {
    const {content} = pkg.pkgFiles[file];
    if (pkgs[name].nextRelease && pkgs[name].nextRelease.version) {
      content[key][pkgConfigs[file].decodeName(name)] = '^' + pkgs[name].nextRelease.version;
    }
  });

  logger.log('Write package in %s with version %O', pkg.path, pkg.nextRelease.version);
  if (!options.dryRun) {
    forEach(pkg.pkgFiles, ({content, indent, newline}, name) => {
      fs.writeFileSync(path.join(cwd, name), stringifyPackage(content, indent, newline));
    });
  }
}

module.exports = {initPkgs, analyzeCommitsAll, generateNotes, prepare};