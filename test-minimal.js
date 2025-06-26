#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');

const program = new Command();

program
  .name('neandoc-test')
  .description('Test CLI')
  .version('1.0.0')
  .option('--test', 'Test option')
  .action((options) => {
    console.log(chalk.blue('🦣 Test successful!'));
    console.log('Options:', options);
    process.exit(0);
  });

program.parse(process.argv);