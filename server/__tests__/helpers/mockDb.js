
function mockQuery(value) {
  const q = {};
  q.sort = jest.fn().mockReturnValue(q);
  q.select = jest.fn().mockReturnValue(q);
  q.lean = jest.fn().mockReturnValue(q);
  q.then = (resolve, reject) => Promise.resolve(value).then(resolve, reject);
  q.catch = (reject) => Promise.resolve(value).catch(reject);
  return q;
}

function mockDocument(data, overrides = {}) {
  return {
    _id: data._id || 'mock-id-' + Math.random().toString(36).slice(2),
    ...data,
    save: jest.fn().mockResolvedValue(undefined),
    toObject: jest.fn().mockReturnValue({ ...data, _id: data._id || 'mock-id' }),
    comparePassword: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

module.exports = { mockQuery, mockDocument };
