const request = require('supertest');
const app = require('../../app');
const { mockQuery, mockDocument } = require('../helpers/mockDb');

jest.mock('../../models/User');
jest.mock('../../models/Customer');

const User = require('../../models/User');
const Customer = require('../../models/Customer');

const validShopOwnerRegistration = {
  Phone: '0911223344',
  Name: 'Abebe Bikila',
  Shop_Name: 'Abebe Minimart',
  Password: 'securepass123',
  Role: 'Shop_Owner'
};

const validCustomerRegistration = {
  Phone: '0922334455',
  Name: 'Kebede Alemu',
  Password: 'custpass123',
  Role: 'Customer'
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  test('should_register_shop_owner_when_valid_data', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedDoc = mockDocument({
      _id: 'user123', Name: 'Abebe Bikila', Phone: '0911223344',
      Role: 'Shop_Owner', Shop_Name: 'Abebe Minimart', Password: 'hashed'
    });
    User.mockImplementation(() => savedDoc);

    const res = await request(app).post('/api/auth/register').send(validShopOwnerRegistration);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.Name).toBe('Abebe Bikila');
    expect(res.body.user.Password).toBeUndefined();
    expect(savedDoc.save).toHaveBeenCalled();
  });

  test('should_register_customer_when_valid_data', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedDoc = mockDocument({
      _id: 'cust1', Name: 'Kebede Alemu', Phone: '0922334455',
      Role: 'Customer', Password: 'hashed'
    });
    User.mockImplementation(() => savedDoc);
    Customer.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const res = await request(app).post('/api/auth/register').send(validCustomerRegistration);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.Password).toBeUndefined();
  });

  test('should_link_manual_records_when_customer_registers', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedDoc = mockDocument({
      _id: 'cust1', Name: 'Kebede', Phone: '0922334455', Role: 'Customer'
    });
    User.mockImplementation(() => savedDoc);
    Customer.updateMany.mockResolvedValue({ modifiedCount: 2 });

    await request(app).post('/api/auth/register').send(validCustomerRegistration);

    expect(Customer.updateMany).toHaveBeenCalledWith(
      { Phone: '0922334455', Is_Registered: false },
      { Is_Registered: true, Registered_UserId: 'cust1' }
    );
  });

  test('should_return_400_when_missing_fields_on_register', async () => {
    const res = await request(app).post('/api/auth/register').send({ Phone: '0911223344' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing|required/i);
  });

  test('should_return_400_when_shop_owner_missing_shop_name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      Phone: '0911223344', Name: 'Test', Password: 'pass123', Role: 'Shop_Owner'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/shop name/i);
  });

  test('should_return_400_when_invalid_phone_on_register', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validShopOwnerRegistration, Phone: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid phone/i);
  });

  test('should_return_400_when_password_too_short', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validShopOwnerRegistration, Password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6/i);
  });

  test('should_return_400_when_phone_and_role_already_registered', async () => {
    User.findOne.mockReturnValue(mockQuery({ _id: 'existing' }));

    const res = await request(app).post('/api/auth/register').send(validShopOwnerRegistration);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test('should_allow_same_phone_different_role', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedDoc = mockDocument({
      _id: 'cust1', Name: 'Kebede', Phone: '0911223344', Role: 'Customer'
    });
    User.mockImplementation(() => savedDoc);
    Customer.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const res = await request(app).post('/api/auth/register').send({
      Phone: '0911223344', Name: 'Kebede', Password: 'pass123', Role: 'Customer'
    });

    expect(res.status).toBe(200);
  });

  test('should_normalize_plus251_phone_when_registering', async () => {
    User.findOne.mockReturnValue(mockQuery(null));
    const savedDoc = mockDocument({
      _id: 'u1', Name: 'Test', Phone: '0911223344',
      Role: 'Shop_Owner', Password: 'h'
    });
    User.mockImplementation(() => savedDoc);

    const res = await request(app).post('/api/auth/register')
      .send({ ...validShopOwnerRegistration, Phone: '+251911223344' });

    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/login', () => {
  test('should_login_shop_owner_when_valid_credentials', async () => {
    const userDoc = mockDocument({
      _id: 'user123', Name: 'Abebe', Phone: '0911223344',
      Role: 'Shop_Owner', Password: 'hashed'
    });
    userDoc.comparePassword.mockResolvedValue(true);
    User.findOne.mockReturnValue(mockQuery(userDoc));

    const res = await request(app).post('/api/auth/login')
      .send({ Phone: '0911223344', Password: 'securepass123', Role: 'Shop_Owner' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.Name).toBe('Abebe');
  });

  test('should_login_customer_when_valid_credentials', async () => {
    const userDoc = mockDocument({
      _id: 'cust1', Name: 'Kebede', Phone: '0922334455',
      Role: 'Customer', Password: 'hashed'
    });
    userDoc.comparePassword.mockResolvedValue(true);
    User.findOne.mockReturnValue(mockQuery(userDoc));

    const res = await request(app).post('/api/auth/login')
      .send({ Phone: '0922334455', Password: 'custpass123', Role: 'Customer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should_not_return_password_when_login_success', async () => {
    const userDoc = mockDocument({
      _id: 'u1', Name: 'A', Phone: '0911223344', Role: 'Shop_Owner', Password: 'h'
    });
    userDoc.comparePassword.mockResolvedValue(true);
    User.findOne.mockReturnValue(mockQuery(userDoc));

    const res = await request(app).post('/api/auth/login')
      .send({ Phone: '0911223344', Password: 'pass', Role: 'Shop_Owner' });

    expect(res.body.user.Password).toBeUndefined();
  });

  test('should_return_400_when_missing_phone_password_or_role', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ Phone: '0911223344' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('should_return_400_when_invalid_phone_format', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ Phone: 'badphone', Password: 'pass', Role: 'Shop_Owner' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid phone/i);
  });

  test('should_return_401_when_wrong_password', async () => {
    const userDoc = mockDocument({ _id: 'u1', Name: 'A', Phone: '0911223344', Password: 'h', Role: 'Shop_Owner' });
    userDoc.comparePassword.mockResolvedValue(false);
    User.findOne.mockReturnValue(mockQuery(userDoc));

    const res = await request(app).post('/api/auth/login')
      .send({ Phone: '0911223344', Password: 'wrong', Role: 'Shop_Owner' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrect password/i);
  });

  test('should_return_404_when_user_not_found_for_role', async () => {
    User.findOne.mockReturnValue(mockQuery(null));

    const res = await request(app).post('/api/auth/login')
      .send({ Phone: '0999887766', Password: 'anypass', Role: 'Shop_Owner' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('PUT /api/auth/profile/:id', () => {
  test('should_update_profile_when_valid_data', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery({
      _id: 'u1', Name: 'Updated', Shop_Name: 'New Shop', Phone: '0911223344'
    }));

    const res = await request(app).put('/api/auth/profile/u1')
      .send({ Name: 'Updated', Shop_Name: 'New Shop' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.Name).toBe('Updated');
  });

  test('should_return_404_when_updating_nonexistent_user', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(null));

    const res = await request(app).put('/api/auth/profile/fakeid')
      .send({ Name: 'Nobody' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/auth/verify', () => {
  test('should_return_success_when_called', async () => {
    const res = await request(app).post('/api/auth/verify');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
