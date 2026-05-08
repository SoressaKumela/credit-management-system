const request = require('supertest');
const app = require('../../app');
const { mockQuery, mockDocument } = require('../helpers/mockDb');

jest.mock('../../models/Customer');
jest.mock('../../models/Transaction');
jest.mock('../../models/User');

const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/customers', () => {
  test('should_return_customers_when_ownerId_provided', async () => {
    const customers = [
      mockDocument({ _id: 'c1', Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, Is_Registered: true }),
      mockDocument({ _id: 'c2', Name: 'Almaz', Phone: '0911000002', Current_Balance: 200, Is_Registered: false })
    ];
    Customer.find.mockReturnValue(mockQuery(customers));
    Transaction.findOne.mockReturnValue(mockQuery(null));

    const res = await request(app).get('/api/customers?ownerId=owner1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('agingDays');
  });

  test('should_return_400_when_ownerId_missing', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ownerId/i);
  });

  test('should_calculate_aging_days_when_gave_transaction_exists', async () => {
    const customer = mockDocument({ _id: 'c1', Name: 'Kebede', Current_Balance: 500 });
    Customer.find.mockReturnValue(mockQuery([customer]));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    Transaction.findOne.mockReturnValue(mockQuery({ date: thirtyDaysAgo }));

    const res = await request(app).get('/api/customers?ownerId=owner1');

    expect(res.body[0].agingDays).toBeGreaterThanOrEqual(29);
  });

  test('should_set_aging_zero_when_no_gave_transaction', async () => {
    const customer = mockDocument({ _id: 'c1', Name: 'Kebede', Current_Balance: 0 });
    Customer.find.mockReturnValue(mockQuery([customer]));
    Transaction.findOne.mockReturnValue(mockQuery(null));

    const res = await request(app).get('/api/customers?ownerId=owner1');

    expect(res.body[0].agingDays).toBe(0);
  });
});

describe('GET /api/customers/my-debts/:phone', () => {
  test('should_return_all_debts_for_customer_phone', async () => {
    const debts = [
      mockDocument({ _id: 'c1', Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, OwnerId: { Name: 'Shop A', Shop_Name: 'A' } }),
      mockDocument({ _id: 'c2', Name: 'Kebede', Phone: '0911000001', Current_Balance: 300, OwnerId: { Name: 'Shop B', Shop_Name: 'B' } })
    ];
    const populateQuery = mockQuery(debts);
    Customer.find.mockReturnValue({ populate: jest.fn().mockReturnValue(populateQuery) });

    const res = await request(app).get('/api/customers/my-debts/0911000001');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('should_return_empty_when_no_debts', async () => {
    const populateQuery = mockQuery([]);
    Customer.find.mockReturnValue({ populate: jest.fn().mockReturnValue(populateQuery) });

    const res = await request(app).get('/api/customers/my-debts/0911000001');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('should_return_400_when_invalid_phone_format', async () => {
    const res = await request(app).get('/api/customers/my-debts/badphone');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/customers/search/:phone', () => {
  test('should_return_customer_when_registered', async () => {
    User.findOne.mockReturnValue(mockQuery({ _id: 'u1', Name: 'Kebede', Phone: '0911000001', Role: 'Customer' }));

    const res = await request(app).get('/api/customers/search/0911000001');

    expect(res.status).toBe(200);
    expect(res.body.Name).toBe('Kebede');
  });

  test('should_return_404_when_customer_not_registered', async () => {
    User.findOne.mockReturnValue(mockQuery(null));

    const res = await request(app).get('/api/customers/search/0911000001');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no registered customer/i);
  });

  test('should_return_400_when_invalid_phone', async () => {
    const res = await request(app).get('/api/customers/search/bad');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/customers', () => {
  test('should_create_customer_when_valid_data', async () => {
    const ownerDoc = { _id: 'owner1', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));
    Customer.findOne.mockReturnValue(mockQuery(null));
    User.findOne.mockReturnValue(mockQuery(null));

    const savedCustomer = mockDocument({
      _id: 'c1', Name: 'Kebede', Phone: '0911000001', Current_Balance: 0, Is_Registered: false
    });
    Customer.mockImplementation(() => savedCustomer);
    Transaction.mockImplementation(() => mockDocument({ _id: 'tx1' }));

    const res = await request(app).post('/api/customers')
      .send({ Name: 'Kebede', Phone: '0911000001', OwnerId: 'owner1' });

    expect(res.status).toBe(200);
    expect(res.body.Name).toBe('Kebede');
    expect(savedCustomer.save).toHaveBeenCalled();
  });

  test('should_block_self_dealing_when_owner_adds_own_phone', async () => {
    const ownerDoc = { _id: 'owner1', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));

    const res = await request(app).post('/api/customers')
      .send({ Name: 'Myself', Phone: '0911223344', OwnerId: 'owner1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  test('should_block_duplicate_customer_for_same_owner', async () => {
    const ownerDoc = { _id: 'owner1', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));
    Customer.findOne.mockReturnValue(mockQuery({ _id: 'existing' }));

    const res = await request(app).post('/api/customers')
      .send({ Name: 'Kebede', Phone: '0911000001', OwnerId: 'owner1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already in your ledger/i);
  });

  test('should_mark_Is_Registered_true_when_customer_exists_in_user_table', async () => {
    const ownerDoc = { _id: 'owner1', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));
    Customer.findOne.mockReturnValue(mockQuery(null));
    User.findOne.mockReturnValueOnce(mockQuery(ownerDoc))
      .mockReturnValueOnce(mockQuery({ _id: 'regUser', Phone: '0911000001', Role: 'Customer' }));

    const savedCustomer = mockDocument({
      _id: 'c1', Name: 'Kebede', Phone: '0911000001', Current_Balance: 0, Is_Registered: true
    });
    Customer.mockImplementation(() => savedCustomer);

    await request(app).post('/api/customers')
      .send({ Name: 'Kebede', Phone: '0911000001', OwnerId: 'owner1' });

    expect(savedCustomer.save).toHaveBeenCalled();
  });

  test('should_create_initial_transaction_when_balance_positive', async () => {
    const ownerDoc = { _id: 'owner1', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));
    Customer.findOne.mockReturnValue(mockQuery(null));
    User.findOne.mockReturnValue(mockQuery(null));

    const savedCustomer = mockDocument({
      _id: 'c1', Name: 'Kebede', Phone: '0911000001', Current_Balance: 500
    });
    Customer.mockImplementation(() => savedCustomer);
    const txDoc = mockDocument({ _id: 'tx1' });
    Transaction.mockImplementation(() => txDoc);

    await request(app).post('/api/customers')
      .send({ Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, OwnerId: 'owner1' });

    expect(txDoc.save).toHaveBeenCalled();
  });

  test('should_return_400_when_invalid_phone_format', async () => {
    const res = await request(app).post('/api/customers')
      .send({ Name: 'Kebede', Phone: 'badphone', OwnerId: 'owner1' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/customers/:id', () => {
  test('should_return_customer_by_id_when_exists', async () => {
    Customer.findById.mockReturnValue(mockQuery({ _id: 'c1', Name: 'Kebede' }));

    const res = await request(app).get('/api/customers/c1');

    expect(res.status).toBe(200);
    expect(res.body.Name).toBe('Kebede');
  });

  test('should_return_404_when_customer_not_found', async () => {
    Customer.findById.mockReturnValue(mockQuery(null));

    const res = await request(app).get('/api/customers/fakeid');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/customers/:id', () => {
  test('should_update_customer_when_valid_data', async () => {
    Customer.findByIdAndUpdate.mockReturnValue(
      mockQuery({ _id: 'c1', Name: 'Updated', Phone: '0911000099' })
    );

    const res = await request(app).put('/api/customers/c1')
      .send({ Name: 'Updated', Phone: '0911000099' });

    expect(res.status).toBe(200);
    expect(res.body.Name).toBe('Updated');
  });

  test('should_return_404_when_updating_nonexistent_customer', async () => {
    Customer.findByIdAndUpdate.mockReturnValue(mockQuery(null));

    const res = await request(app).put('/api/customers/fakeid')
      .send({ Name: 'Nobody' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/:id', () => {
  test('should_delete_customer_and_transactions_when_exists', async () => {
    Customer.findByIdAndDelete.mockReturnValue(mockQuery({ _id: 'c1' }));
    Transaction.deleteMany.mockResolvedValue({ deletedCount: 3 });

    const res = await request(app).delete('/api/customers/c1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Transaction.deleteMany).toHaveBeenCalledWith({ customerId: 'c1' });
  });

  test('should_return_404_when_deleting_nonexistent_customer', async () => {
    Customer.findByIdAndDelete.mockReturnValue(mockQuery(null));

    const res = await request(app).delete('/api/customers/fakeid');

    expect(res.status).toBe(404);
  });
});
