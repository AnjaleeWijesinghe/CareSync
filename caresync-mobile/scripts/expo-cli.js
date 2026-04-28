#!/usr/bin/env node

const Module = require('module');

if (Array.isArray(Module.builtinModules)) {
  Module.builtinModules = Module.builtinModules.filter((moduleId) => !moduleId.includes(':'));
}

process.argv[1] = require.resolve('expo/bin/cli');
require(process.argv[1]);
