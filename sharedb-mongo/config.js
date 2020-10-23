function resolve(prefix) {
  return names => {
    return names.map(name => `./${prefix}/${name}.md`);
  };
}

export default [
  {
    title: 'ShareDB Mongo',
    children: resolve('sharedb-mongo')([
      'sharedb-mongo',
      'usage',
      'queries',
      'get-ops',
      'errors',
      'notes',
    ]),
  },
];
