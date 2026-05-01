const mongoose = require('mongoose');

const User = require('../../models/User');
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const Dispute = require('../../models/Dispute');

describe('User Model Schema', () => {
  test('should_fail_validation_when_name_missing', () => {
    const user = new User({ Phone: '0911223344', Password: 'pass123', Role: 'Shop_Owner' });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.Name).toBeDefined();
  });

  test('should_fail_validation_when_phone_missing', () => {
    const user = new User({ Name: 'Test', Password: 'pass123', Role: 'Shop_Owner' });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.Phone).toBeDefined();
  });

  test('should_fail_validation_when_password_missing', () => {
    const user = new User({ Name: 'Test', Phone: '0911223344', Role: 'Shop_Owner' });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.Password).toBeDefined();
  });

  test('should_fail_validation_when_role_invalid', () => {
    const user = new User({ Name: 'Test', Phone: '0911223344', Password: 'pass', Role: 'Admin' });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.Role).toBeDefined();
  });

  test('should_pass_validation_when_all_fields_valid_shop_owner', () => {
    const user = new User({ Name: 'Test', Phone: '0911223344', Password: 'pass123', Role: 'Shop_Owner' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  test('should_accept_customer_role', () => {
    const user = new User({ Name: 'Test', Phone: '0911223344', Password: 'pass123', Role: 'Customer' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  test('should_allow_same_phone_different_roles_in_schema', () => {
    const owner = new User({ Name: 'Owner', Phone: '0911223344', Password: 'pass', Role: 'Shop_Owner' });
    const customer = new User({ Name: 'Customer', Phone: '0911223344', Password: 'pass', Role: 'Customer' });
    expect(owner.validateSync()).toBeUndefined();
    expect(customer.validateSync()).toBeUndefined();
  });
});

describe('Customer Model Schema', () => {
  test('should_fail_validation_when_name_missing', () => {
    const c = new Customer({ Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    const err = c.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.Name).toBeDefined();
  });

  test('should_fail_validation_when_ownerId_missing', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001' });
    const err = c.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.OwnerId).toBeDefined();
  });

  test('should_default_balance_to_zero', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    expect(c.Current_Balance).toBe(0);
  });

  test('should_default_Is_Registered_to_false', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    expect(c.Is_Registered).toBe(false);
  });

  test('should_default_Registered_UserId_to_null', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    expect(c.Registered_UserId).toBeNull();
  });

  test('should_default_Credit_Limit_to_zero', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    expect(c.Credit_Limit).toBe(0);
  });

  test('should_default_Repayment_Cycle_to_FLEXIBLE', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    expect(c.Repayment_Cycle).toBe('FLEXIBLE');
  });

  test('should_set_created_at_by_default', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    expect(c.Created_At).toBeInstanceOf(Date);
  });

  test('should_pass_validation_when_all_required_fields_present', () => {
    const c = new Customer({ Name: 'Kebede', Phone: '0911000001', OwnerId: new mongoose.Types.ObjectId() });
    const err = c.validateSync();
    expect(err).toBeUndefined();
  });

  test('should_accept_registered_customer_with_userId', () => {
    const c = new Customer({
      Name: 'Kebede', Phone: '0911000001',
      OwnerId: new mongoose.Types.ObjectId(),
      Is_Registered: true,
      Registered_UserId: new mongoose.Types.ObjectId()
    });
    const err = c.validateSync();
    expect(err).toBeUndefined();
  });
});

describe('Transaction Model Schema', () => {
  test('should_fail_validation_when_type_invalid', () => {
    const t = new Transaction({ customerId: new mongoose.Types.ObjectId(), type: 'INVALID', amount: 100 });
    const err = t.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.type).toBeDefined();
  });

  test('should_accept_gave_type', () => {
    const t = new Transaction({ customerId: new mongoose.Types.ObjectId(), type: 'GAVE', amount: 100 });
    const err = t.validateSync();
    expect(err).toBeUndefined();
  });

  test('should_accept_got_type', () => {
    const t = new Transaction({ customerId: new mongoose.Types.ObjectId(), type: 'GOT', amount: 100 });
    const err = t.validateSync();
    expect(err).toBeUndefined();
  });

  test('should_fail_validation_when_customerId_missing', () => {
    const t = new Transaction({ type: 'GAVE', amount: 100 });
    const err = t.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.customerId).toBeDefined();
  });

  test('should_fail_validation_when_amount_missing', () => {
    const t = new Transaction({ customerId: new mongoose.Types.ObjectId(), type: 'GAVE' });
    const err = t.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.amount).toBeDefined();
  });

  test('should_default_date_to_now', () => {
    const t = new Transaction({ customerId: new mongoose.Types.ObjectId(), type: 'GAVE', amount: 100 });
    expect(t.date).toBeInstanceOf(Date);
  });
});

describe('Dispute Model Schema', () => {
  test('should_fail_validation_when_customerId_missing', () => {
    const d = new Dispute({ reason: 'Wrong amount', ownerId: new mongoose.Types.ObjectId() });
    const err = d.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.customerId).toBeDefined();
  });

  test('should_fail_validation_when_reason_missing', () => {
    const d = new Dispute({ customerId: new mongoose.Types.ObjectId(), ownerId: new mongoose.Types.ObjectId() });
    const err = d.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.reason).toBeDefined();
  });

  test('should_default_status_to_OPEN', () => {
    const d = new Dispute({
      customerId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      reason: 'Test'
    });
    expect(d.status).toBe('OPEN');
  });

  test('should_pass_validation_when_all_required_present', () => {
    const d = new Dispute({
      customerId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      reason: 'Wrong charge'
    });
    const err = d.validateSync();
    expect(err).toBeUndefined();
  });
});
