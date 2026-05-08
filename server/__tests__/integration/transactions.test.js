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

describe('POST /api/transactions', () => {
  test('should_create_gave_transaction_when_valid', async () => {
    const customerDoc = mockDocument({ _id: 'c1', Current_Balance: 0 });
    Customer.findById.mockReturnValue(mockQuery(customerDoc));
    const txDoc = mockDocument({ _id: 'tx1', customerId: 'c1', type: 'GAVE', amount: 500, description: 'Goods' });
    Transaction.mockImplementation(() => txDoc);

    const res = await request(app).post('/api/transactions')
      .send({ customerId: 'c1', type: 'GAVE', amount: 500, description: 'Goods' });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('GAVE');
    expect(res.body.amount).toBe(500);
    expect(txDoc.save).toHaveBeenCalled();
  });

  test('should_increase_balance_when_gave_transaction', async () => {
    const customerDoc = mockDocument({ _id: 'c1', Current_Balance: 0 });
    Customer.findById.mockReturnValue(mockQuery(customerDoc));
    Transaction.mockImplementation((data) => mockDocument({ _id: 'tx1', ...data }));

    await request(app).post('/api/transactions')
      .send({ customerId: 'c1', type: 'GAVE', amount: 500 });

    expect(customerDoc.Current_Balance).toBe(500);
    expect(customerDoc.save).toHaveBeenCalled();
  });

  test('should_decrease_balance_when_got_transaction', async () => {
    const customerDoc = mockDocument({ _id: 'c1', Current_Balance: 500, Next_Due_Date: null });
    Customer.findById.mockReturnValue(mockQuery(customerDoc));
    Transaction.mockImplementation((data) => mockDocument({ _id: 'tx1', ...data }));
    Transaction.updateMany.mockResolvedValue({ modifiedCount: 0 });
    Transaction.findOne.mockReturnValue(mockQuery(null));

    await request(app).post('/api/transactions')
      .send({ customerId: 'c1', type: 'GOT', amount: 200 });

    expect(customerDoc.Current_Balance).toBe(300);
    expect(customerDoc.save).toHaveBeenCalled();
  });

  test('should_return_404_when_customer_not_found', async () => {
    Customer.findById.mockReturnValue(mockQuery(null));

    const res = await request(app).post('/api/transactions')
      .send({ customerId: 'bad-id', type: 'GAVE', amount: 100 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('GET /api/transactions/:customerId', () => {
  test('should_return_transactions_for_customer', async () => {
    const txList = [
      { _id: 'tx1', type: 'GAVE', amount: 100, date: new Date() },
      { _id: 'tx2', type: 'GOT', amount: 50, date: new Date() }
    ];
    Transaction.find.mockReturnValue(mockQuery(txList));

    const res = await request(app).get('/api/transactions/c1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('should_return_empty_array_when_no_transactions', async () => {
    Transaction.find.mockReturnValue(mockQuery([]));

    const res = await request(app).get('/api/transactions/c1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
