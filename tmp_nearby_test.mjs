import http from 'http';
const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 101];
const fetchId = (id) => new Promise((resolve) => {
  const req = http.get(`http://localhost:5001/api/nearby/${id}`, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => resolve({ id, status: res.statusCode, body: body.slice(0, 1600) }));
  });
  req.on('error', (err) => resolve({ id, status: 'ERR', body: err.message }));
});
(async () => {
  for (const id of ids) {
    const result = await fetchId(id);
    console.log('ID', result.id, 'STATUS', result.status);
    console.log(result.body);
    console.log('---');
  }
})();
