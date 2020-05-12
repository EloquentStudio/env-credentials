'use strict';

module.exports = {
  opts: {
    readme: './README.md',
    package: './package.json',
    recurse: true,
    verbose: true,
    destination: './docs/'
  },
  plugins: [
    'plugins/markdown'
  ],
  source: {
    excludePattern: '(^|\\/|\\\\)[._]',
    include: [
      'src'
    ],
    includePattern: '\\.js$'
  },
  templates: {
    includeDate: false,
    sourceFiles: false
  },
  markdown: {
    idInHeadings: true
  }
};
