
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

const axios = require('axios');
const { Alert } = require('react-native');

let useStore;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  jest.mock('axios', () => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }));

  const store = require('../../store/useStore');
  useStore = store.useStore;

  useStore.setState({
    user: null,
    customers: [],
    transactions: [],
    collections: 0,
    disputes: [],
    myDebts: [],
    loading: false
  });
});

describe('Store: login', () => {
  test('should_set_user_when_login_succeeds', async () => {
    const mockUser = {
      _id: 'user123', Name: 'Abebe', Phone: '0911223344',
      Role: 'Shop_Owner', Shop_Name: 'Test Shop'
    };
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: mockUser } });

    await useStore.getState().login('0911223344', 'pass123', 'Shop_Owner');

    expect(useStore.getState().user).toEqual(mockUser);
    expect(useStore.getState().loading).toBe(false);
  });

  test('should_send_role_in_login_payload', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: {} } });

    await useStore.getState().login('0911223344', 'mypassword', 'Shop_Owner');

    expect(ax.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      { Phone: '0911223344', Password: 'mypassword', Role: 'Shop_Owner' }
    );
  });

  test('should_send_customer_role_when_logging_in_as_customer', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: { Role: 'Customer' } } });

    await useStore.getState().login('0922334455', 'pass123', 'Customer');

    expect(ax.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      { Phone: '0922334455', Password: 'pass123', Role: 'Customer' }
    );
  });

  test('should_show_alert_when_login_fails_with_server_error', async () => {
    const ax = require('axios');
    const { Alert: alert } = require('react-native');
    ax.post.mockRejectedValue({
      response: { data: { error: 'Incorrect password.' } }
    });

    await useStore.getState().login('0911223344', 'wrongpass', 'Shop_Owner');

    expect(useStore.getState().user).toBeNull();
    expect(useStore.getState().loading).toBe(false);
    expect(alert.alert).toHaveBeenCalledWith('Login Error', 'Incorrect password.');
  });

  test('should_show_generic_error_when_network_fails', async () => {
    const ax = require('axios');
    const { Alert: alert } = require('react-native');
    ax.post.mockRejectedValue(new Error('Network Error'));

    await useStore.getState().login('0911223344', 'pass', 'Shop_Owner');

    expect(alert.alert).toHaveBeenCalledWith(
      'Login Error',
      'Login failed. Please check your connection.'
    );
  });

  test('should_clear_loading_when_login_fails', async () => {
    const ax = require('axios');
    ax.post.mockRejectedValue(new Error('fail'));

    await useStore.getState().login('0911223344', 'pass', 'Shop_Owner');

    expect(useStore.getState().loading).toBe(false);
  });
});

describe('Store: register', () => {
  test('should_set_user_when_registration_succeeds', async () => {
    const mockUser = { _id: 'user456', Name: 'New User', Phone: '0922334455', Role: 'Shop_Owner' };
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: mockUser } });

    await useStore.getState().register({
      Phone: '0922334455', Name: 'New User', Shop_Name: 'New Shop', Password: 'pass123', Role: 'Shop_Owner'
    });

    expect(useStore.getState().user).toEqual(mockUser);
    expect(useStore.getState().loading).toBe(false);
  });

  test('should_register_customer_without_shop_name', async () => {
    const mockUser = { _id: 'cust1', Name: 'Kebede', Phone: '0922334455', Role: 'Customer' };
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: mockUser } });

    await useStore.getState().register({
      Phone: '0922334455', Name: 'Kebede', Password: 'pass123', Role: 'Customer'
    });

    expect(useStore.getState().user).toEqual(mockUser);
  });

  test('should_show_alert_when_registration_fails', async () => {
    const ax = require('axios');
    const { Alert: alert } = require('react-native');
    ax.post.mockRejectedValue({
      response: { data: { error: 'Phone number already registered as a Shop Owner.' } }
    });

    await useStore.getState().register({
      Phone: '0911223344', Name: 'Test', Shop_Name: 'Shop', Password: 'pass123', Role: 'Shop_Owner'
    });

    expect(useStore.getState().user).toBeNull();
    expect(alert.alert).toHaveBeenCalledWith('Registration Error', 'Phone number already registered as a Shop Owner.');
  });
});

describe('Store: fetchCustomers', () => {
  test('should_fetch_customers_when_user_exists', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const mockCustomers = [
      { _id: 'c1', Name: 'Kebede', Current_Balance: 500, agingDays: 10, Is_Registered: true },
      { _id: 'c2', Name: 'Almaz', Current_Balance: 200, agingDays: 0, Is_Registered: false }
    ];
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: mockCustomers });

    await useStore.getState().fetchCustomers();

    expect(useStore.getState().customers).toEqual(mockCustomers);
    expect(ax.get).toHaveBeenCalledWith(expect.stringContaining('/customers?ownerId=owner123'));
  });

  test('should_not_fetch_when_user_null', async () => {
    useStore.setState({ user: null });
    const ax = require('axios');

    await useStore.getState().fetchCustomers();

    expect(ax.get).not.toHaveBeenCalled();
  });
});

describe('Store: addCustomer', () => {
  test('should_post_customer_with_ownerId_and_refresh_list', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { _id: 'new-c', Name: 'Kebede' } });
    ax.get.mockResolvedValue({ data: [] });

    const result = await useStore.getState().addCustomer({
      Name: 'Kebede', Phone: '0911000001', Current_Balance: 500
    });

    expect(result.success).toBe(true);
    expect(ax.post).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      expect.objectContaining({
        Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, OwnerId: 'owner123'
      })
    );
  });

  test('should_return_failure_and_show_alert_when_self_dealing', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    const { Alert: alert } = require('react-native');
    ax.post.mockRejectedValue({
      response: { data: { error: "This is yourself, you can't do this." } }
    });

    const result = await useStore.getState().addCustomer({
      Name: 'Me', Phone: '0911223344'
    });

    expect(result.success).toBe(false);
    expect(alert.alert).toHaveBeenCalledWith('Error', "This is yourself, you can't do this.");
  });
});

describe('Store: searchCustomer', () => {
  test('should_return_found_true_when_customer_exists', async () => {
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: { _id: 'u1', Name: 'Kebede', Phone: '0911000001' } });

    const result = await useStore.getState().searchCustomer('0911000001');

    expect(result.found).toBe(true);
    expect(result.customer.Name).toBe('Kebede');
    expect(ax.get).toHaveBeenCalledWith(expect.stringContaining('/customers/search/0911000001'));
  });

  test('should_return_found_false_when_customer_not_registered', async () => {
    const ax = require('axios');
    ax.get.mockRejectedValue({
      response: { data: { message: 'No registered customer found by this phone number.' } }
    });

    const result = await useStore.getState().searchCustomer('0911999999');

    expect(result.found).toBe(false);
    expect(result.message).toMatch(/no registered customer/i);
  });
});

describe('Store: fetchMyDebts', () => {
  test('should_fetch_debts_for_customer_phone', async () => {
    useStore.setState({ user: { _id: 'cust1', Phone: '0911000001' } });
    const mockDebts = [
      { _id: 'd1', Current_Balance: 500, OwnerId: { Shop_Name: 'Shop A' } },
      { _id: 'd2', Current_Balance: 300, OwnerId: { Shop_Name: 'Shop B' } }
    ];
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: mockDebts });

    await useStore.getState().fetchMyDebts();

    expect(useStore.getState().myDebts).toEqual(mockDebts);
    expect(ax.get).toHaveBeenCalledWith(expect.stringContaining('/customers/my-debts/0911000001'));
  });

  test('should_not_fetch_when_user_null', async () => {
    useStore.setState({ user: null });
    const ax = require('axios');

    await useStore.getState().fetchMyDebts();

    expect(ax.get).not.toHaveBeenCalled();
  });
});

describe('Store: deleteCustomer', () => {
  test('should_delete_customer_and_refresh_list', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    ax.delete.mockResolvedValue({ data: { success: true } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().deleteCustomer('customer-to-delete');

    expect(ax.delete).toHaveBeenCalledWith(expect.stringContaining('/customers/customer-to-delete'));
    expect(ax.get).toHaveBeenCalled();
  });
});

describe('Store: addTransaction', () => {
  test('should_post_transaction_and_refresh_data', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { _id: 'tx1' } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().addTransaction({
      customerId: 'cust1', type: 'GAVE', amount: 300, description: 'Goods'
    });

    expect(ax.post).toHaveBeenCalledWith(
      expect.stringContaining('/transactions'),
      { customerId: 'cust1', type: 'GAVE', amount: 300, description: 'Goods' }
    );
  });

  test('should_show_alert_when_transaction_fails', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    const { Alert: alert } = require('react-native');
    ax.post.mockRejectedValue({ response: { data: { error: 'Customer not found' } } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().addTransaction({ customerId: 'bad-id', type: 'GAVE', amount: 100 });

    expect(alert.alert).toHaveBeenCalledWith('Error', 'Customer not found');
  });
});

describe('Store: settleAll', () => {
  test('should_settle_all_debts_and_refresh', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    const { Alert: alert } = require('react-native');
    ax.post.mockResolvedValue({ data: { settledAmount: 1500 } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().settleAll('cust1');

    expect(ax.post).toHaveBeenCalledWith(
      expect.stringContaining('/transactions/settle-all'),
      { customerId: 'cust1' }
    );
    expect(alert.alert).toHaveBeenCalledWith('Success', 'Settled 1500 ETB');
  });
});

describe('Store: fetchDailyCollection', () => {
  test('should_fetch_daily_collection_when_user_exists', async () => {
    useStore.setState({ user: { _id: 'owner123' } });
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: { total: 1500 } });

    await useStore.getState().fetchDailyCollection();

    expect(useStore.getState().collections).toBe(1500);
    expect(ax.get).toHaveBeenCalledWith(expect.stringContaining('/reports/daily-collection?ownerId=owner123'));
  });

  test('should_not_fetch_when_user_null', async () => {
    useStore.setState({ user: null });
    const ax = require('axios');

    await useStore.getState().fetchDailyCollection();

    expect(ax.get).not.toHaveBeenCalled();
  });
});

describe('Store: updateProfile', () => {
  test('should_update_profile_and_set_user_when_success', async () => {
    useStore.setState({ user: { _id: 'owner123', Name: 'Old', Shop_Name: 'Old Shop' } });
    const updatedUser = { _id: 'owner123', Name: 'New', Shop_Name: 'New Shop' };
    const ax = require('axios');
    ax.put.mockResolvedValue({ data: { success: true, user: updatedUser } });

    await useStore.getState().updateProfile({ Name: 'New', Shop_Name: 'New Shop' });

    expect(useStore.getState().user).toEqual(updatedUser);
    expect(useStore.getState().loading).toBe(false);
    expect(ax.put).toHaveBeenCalledWith(
      expect.stringContaining('/auth/profile/owner123'),
      { Name: 'New', Shop_Name: 'New Shop' }
    );
  });

  test('should_not_update_when_user_null', async () => {
    useStore.setState({ user: null });
    const ax = require('axios');

    await useStore.getState().updateProfile({ Name: 'Test' });

    expect(ax.put).not.toHaveBeenCalled();
  });
});

describe('Store: Error Handling', () => {
  test('should_handle_server_down_gracefully_when_fetching_customers', async () => {
    useStore.setState({ user: { _id: 'owner1' }, customers: [{ _id: 'old' }] });
    const ax = require('axios');
    ax.get.mockRejectedValue(new Error('ECONNREFUSED'));

    await useStore.getState().fetchCustomers();

    expect(useStore.getState().customers).toEqual([{ _id: 'old' }]);
  });
});
