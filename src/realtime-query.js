function parseQuery(url = '') {
  const query = new URL(url, 'http://localhost').searchParams;
  return {
    token: query.get('token') || undefined,
  };
}

module.exports = {
  parseQuery,
};
