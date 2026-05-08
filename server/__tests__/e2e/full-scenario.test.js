const request = require('supertest');
const app = require('../../app');
const { mockQuery, mockDocument } = require('../helpers/mockDb');

jest.mock('../../models/User');
jest.mock('../../models/Customer');
jest.mock('../../models/Transaction');

const User = require('../../models/User');
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('E2E: Shop Owner Full Lifecycle', () => {
  test('Step 1: should_register_shop_owner_with_role_in_payload', async () => {
    const frontendPayload = {
      Phone: '0911223344',
      Name: 'Abebe Bikila',
      Shop_Name: 'Abebe Minimart',
      Password: 'securepass123',
      Role: 'Shop_Owner'
    };

    User.findOne.mockReturnValue(mockQuery(null));
    const savedUser = mockDocument({
      _id: 'user123', ...frontendPayload
    });
    User.mockImplementation(() => savedUser);

    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(frontendPayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('_id');
    expect(res.body.user).toHaveProperty('Name');
    expect(res.body.user).toHaveProperty('Phone');
    expect(res.body.user).not.toHaveProperty('Password');
    expect(typeof res.body.user._id).toBe('string');
  });

  test('Step 2: should_login_shop_owner_with_role_in_payload', async () => {
    const userDoc = mockDocument({
      _id: 'user123', Name: 'Abebe', Phone: '0911223344',
      Role: 'Shop_Owner', Password: 'hashed'
    });
    userDoc.comparePassword.mockResolvedValue(true);
    User.findOne.mockReturnValue(mockQuery(userDoc));

    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ Phone: '0911223344', Password: 'securepass123', Role: 'Shop_Owner' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user._id).toBeDefined();
  });

  test('Step 3: should_add_customer_with_self_dealing_check', async () => {
    const ownerDoc = { _id: 'user123', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));
    Customer.findOne.mockReturnValue(mockQuery(null));
    User.findOne.mockReturnValue(mockQuery(null));

    const savedCustomer = mockDocument({
      _id: 'c1', Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, OwnerId: 'user123', Is_Registered: false
    });
    Customer.mockImplementation(() => savedCustomer);
    Transaction.mockImplementation(() => mockDocument({ _id: 'tx1' }));

    const res = await request(app)
      .post('/api/customers')
      .set('Content-Type', 'application/json')
      .send({ Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, OwnerId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('Name', 'Kebede');
    expect(res.body).toHaveProperty('Current_Balance', 500);
  });

  test('Step 4: should_block_adding_self_as_customer', async () => {
    const ownerDoc = { _id: 'user123', Phone: '0911223344' };
    User.findById.mockReturnValue(mockQuery(ownerDoc));

    const res = await request(app)
      .post('/api/customers')
      .set('Content-Type', 'application/json')
      .send({ Name: 'Me', Phone: '0911223344', OwnerId: 'user123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  test('Step 5: should_record_transaction_with_correct_frontend_payload', async () => {
    const customerDoc = mockDocument({ _id: 'c1', Current_Balance: 0 });
    Customer.findById.mockReturnValue(mockQuery(customerDoc));
    const txDoc = mockDocument({
      _id: 'tx1', customerId: 'c1', type: 'GAVE', amount: 300,
      description: 'Sugar', date: new Date()
    });
    Transaction.mockImplementation(() => txDoc);

    const res = await request(app)
      .post('/api/transactions')
      .set('Content-Type', 'application/json')
      .send({ customerId: 'c1', type: 'GAVE', amount: 300, description: 'Sugar' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('customerId', 'c1');
    expect(res.body).toHaveProperty('type', 'GAVE');
    expect(res.body).toHaveProperty('amount', 300);
    expect(typeof res.body.amount).toBe('number');
  });

  test('Step 6: should_return_aging_report_matching_frontend_format', async () => {
    Customer.find.mockReturnValue(mockQuery([]));

    const res = await request(app).get('/api/reports/aging?ownerId=owner1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('45_plus_days');
    expect(res.body).toHaveProperty('30_days');
    expect(res.body).toHaveProperty('15_days');
    expect(res.body).toHaveProperty('others');
    expect(Array.isArray(res.body['45_plus_days'])).toBe(true);
  });

  test('Step 7: should_return_daily_collection_matching_dashboard_format', async () => {
    Customer.find.mockReturnValue(mockQuery([{ _id: 'c1' }]));
    Transaction.aggregate.mockResolvedValue([{ _id: null, total: 250 }]);

    const res = await request(app).get('/api/reports/daily-collection?ownerId=owner1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(typeof res.body.total).toBe('number');
    expect(res.body.total).toBe(250);
  });

  test('Step 8: should_update_profile_matching_frontend_format', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery({
      _id: 'u1', Name: 'Abebe Updated', Shop_Name: 'New Shop', Phone: '0911223344'
    }));

    const res = await request(app)
      .put('/api/auth/profile/u1')
      .set('Content-Type', 'application/json')
      .send({ Name: 'Abebe Updated', Shop_Name: 'New Shop' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.user.Name).toBe('Abebe Updated');
  });
});

describe('E2E: Customer Registration & Linking', () => {
  test('should_register_customer_and_link_existing_debts', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedUser = mockDocument({
      _id: 'custUser1', Name: 'Kebede', Phone: '0911000001', Role: 'Customer'
    });
    User.mockImplementation(() => savedUser);
    Customer.updateMany.mockResolvedValue({ modifiedCount: 2 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ Phone: '0911000001', Name: 'Kebede', Password: 'pass123', Role: 'Customer' });

    expect(res.status).toBe(200);
    expect(Customer.updateMany).toHaveBeenCalledWith(
      { Phone: '0911000001', Is_Registered: false },
      { Is_Registered: true, Registered_UserId: 'custUser1' }
    );
  });

  test('should_allow_same_phone_to_register_as_both_roles', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedOwner = mockDocument({
      _id: 'ownerUser', Name: 'Dual User', Phone: '0911223344', Role: 'Shop_Owner'
    });
    User.mockImplementation(() => savedOwner);

    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ Phone: '0911223344', Name: 'Dual User', Shop_Name: 'My Shop', Password: 'pass123', Role: 'Shop_Owner' });
    expect(res1.status).toBe(200);

    User.findOne.mockReturnValue(mockQuery(null));
    const savedCust = mockDocument({
      _id: 'custUser', Name: 'Dual User', Phone: '0911223344', Role: 'Customer'
    });
    User.mockImplementation(() => savedCust);
    Customer.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ Phone: '0911223344', Name: 'Dual User', Password: 'pass456', Role: 'Customer' });
    expect(res2.status).toBe(200);
  });
});
