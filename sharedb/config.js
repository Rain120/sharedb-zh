function resolve(prefix) {
  return names => names.map(name => `./${prefix}/${name}.md`);
}

export default [
  {
    title: 'ShareDB',
    children: resolve('sharedb')([
      'sharedb',
      'server-api',
      'client-api',
      'errors',
      'notes',
    ]),
  },
];
