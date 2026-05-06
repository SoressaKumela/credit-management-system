const request = require('supertest');
const app = require('../../app');
const { mockQuery, mockDocument } = require('../helpers/mockDb');

jest.mock('../../models/Customer');
jest.mock('../../models/Transaction');

const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/reports/aging', () => {
  test('should_return_400_when_ownerId_missing', async () => {
    const res = await request(app).get('/api/reports/aging');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ownerId/i);
  });

  test('should_return_empty_categories_when_no_customers', async () => {
    Customer.find.mockReturnValue(mockQuery([]));

    const res = await request(app).get('/api/reports/aging?ownerId=owner1');

    expect(res.status).toBe(200);
    expect(res.body['45_plus_days']).toHaveLength(0);
    expect(res.body['30_days']).toHaveLength(0);
    expect(res.body['15_days']).toHaveLength(0);
    expect(res.body['others']).toHaveLength(0);
  });

  test('should_categorize_45_plus_days_when_old_debt', async () => {
    const customer = mockDocument({ _id: 'c1', Name: 'Old Debtor', Current_Balance: 1000 });
    Customer.find.mockReturnValue(mockQuery([customer]));
    const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
    Transaction.findOne.mockReturnValue(mockQuery({ date: fiftyDaysAgo }));

    const res = await request(app).get('/api/reports/aging?ownerId=owner1');

    expect(res.body['45_plus_days']).toHaveLength(1);
    expect(res.body['45_plus_days'][0].days).toBeGreaterThanOrEqual(49);
  });

  test('should_categorize_30_days_when_moderate_debt', async () => {
    const customer = mockDocument({ _id: 'c1', Name: 'Mid Debtor', Current_Balance: 500 });
    Customer.find.mockReturnValue(mockQuery([customer]));
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    Transaction.findOne.mockReturnValue(mockQuery({ date: thirtyFiveDaysAgo }));

    const res = await request(app).get('/api/reports/aging?ownerId=owner1');

    expect(res.body['30_days']).toHaveLength(1);
  });

  test('should_put_customers_without_gave_in_others_with_0_days', async () => {
    const customer = mockDocument({ _id: 'c1', Name: 'Good Customer' });
    Customer.find.mockReturnValue(mockQuery([customer]));
    Transaction.findOne.mockReturnValue(mockQuery(null));

    const res = await request(app).get('/api/reports/aging?ownerId=owner1');

    expect(res.body['others']).toHaveLength(1);
    expect(res.body['others'][0].days).toBe(0);
  });
});

describe('GET /api/reports/daily-collection', () => {
  test('should_return_400_when_ownerId_missing', async () => {
    const res = await request(app).get('/api/reports/daily-collection');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ownerId/i);
  });

  test('should_return_zero_when_no_collections_today', async () => {
    Customer.find.mockReturnValue(mockQuery([{ _id: 'c1' }]));
    Transaction.aggregate.mockResolvedValue([]);

    const res = await request(app).get('/api/reports/daily-collection?ownerId=owner1');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  test('should_return_total_when_got_transactions_today', async () => {
    Customer.find.mockReturnValue(mockQuery([{ _id: 'c1' }]));
    Transaction.aggregate.mockResolvedValue([{ _id: null, total: 500 }]);

    const res = await request(app).get('/api/reports/daily-collection?ownerId=owner1');

    expect(res.body.total).toBe(500);
  });
});
