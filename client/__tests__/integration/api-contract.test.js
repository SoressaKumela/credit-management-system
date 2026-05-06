
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

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
    user: null, customers: [], transactions: [], collections: 0,
    disputes: [], myDebts: [], loading: false
  });
});

describe('API Contract: Authentication', () => {
  test('should_send_login_payload_with_role', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: { _id: '1' } } });

    await useStore.getState().login('0911223344', 'mypassword', 'Shop_Owner');

    const [url, payload] = ax.post.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(payload).toEqual({ Phone: '0911223344', Password: 'mypassword', Role: 'Shop_Owner' });
    expect(typeof payload.Phone).toBe('string');
    expect(typeof payload.Password).toBe('string');
    expect(typeof payload.Role).toBe('string');
  });

  test('should_send_customer_login_payload_with_customer_role', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: { _id: '1', Role: 'Customer' } } });

    await useStore.getState().login('0922334455', 'pass123', 'Customer');

    const [, payload] = ax.post.mock.calls[0];
    expect(payload.Role).toBe('Customer');
  });

  test('should_send_register_payload_with_role_for_shop_owner', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: { _id: '1' } } });

    await useStore.getState().register({
      Phone: '0911223344', Name: 'Abebe Bikila', Shop_Name: 'Minimart', Password: 'secure123', Role: 'Shop_Owner'
    });

    const [url, payload] = ax.post.mock.calls[0];
    expect(url).toContain('/auth/register');
    expect(payload).toEqual({
      Phone: '0911223344', Name: 'Abebe Bikila', Shop_Name: 'Minimart', Password: 'secure123', Role: 'Shop_Owner'
    });
    expect(Object.keys(payload).sort()).toEqual(['Name', 'Password', 'Phone', 'Role', 'Shop_Name']);
  });

  test('should_send_register_payload_with_role_for_customer', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { success: true, user: { _id: '1' } } });

    await useStore.getState().register({
      Phone: '0922334455', Name: 'Kebede', Password: 'pass123', Role: 'Customer'
    });

    const [, payload] = ax.post.mock.calls[0];
    expect(payload.Role).toBe('Customer');
    expect(payload.Shop_Name).toBeUndefined();
  });

  test('should_send_profile_update_with_correct_json_keys', async () => {
    useStore.setState({ user: { _id: 'uid1' } });
    const ax = require('axios');
    ax.put.mockResolvedValue({ data: { success: true, user: { _id: 'uid1' } } });

    await useStore.getState().updateProfile({ Name: 'New Name', Shop_Name: 'New Shop' });

    const [url, payload] = ax.put.mock.calls[0];
    expect(url).toContain('/auth/profile/uid1');
    expect(payload).toEqual({ Name: 'New Name', Shop_Name: 'New Shop' });
  });
});

describe('API Contract: Customers', () => {
  beforeEach(() => {
    useStore.setState({ user: { _id: 'owner1' } });
  });

  test('should_fetch_customers_with_ownerId_query_param', async () => {
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().fetchCustomers();

    expect(ax.get.mock.calls[0][0]).toContain('/customers?ownerId=owner1');
  });

  test('should_send_add_customer_payload_with_correct_json_keys', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { _id: 'c1' } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().addCustomer({
      Name: 'Kebede', Phone: '0911000001', Current_Balance: 500
    });

    const [url, payload] = ax.post.mock.calls[0];
    expect(url).toContain('/customers');
    expect(payload).toEqual({
      Name: 'Kebede', Phone: '0911000001', Current_Balance: 500, OwnerId: 'owner1'
    });
    expect(typeof payload.Current_Balance).toBe('number');
  });

  test('should_search_customer_with_phone_in_url', async () => {
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: { _id: 'u1', Name: 'Kebede' } });

    await useStore.getState().searchCustomer('0911000001');

    expect(ax.get.mock.calls[0][0]).toContain('/customers/search/0911000001');
  });

  test('should_send_update_customer_payload_with_correct_json_keys', async () => {
    const ax = require('axios');
    ax.put.mockResolvedValue({ data: {} });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().updateCustomer('cust123', { Name: 'Updated', Phone: '0911000099' });

    const [url, payload] = ax.put.mock.calls[0];
    expect(url).toContain('/customers/cust123');
    expect(payload).toEqual({ Name: 'Updated', Phone: '0911000099' });
  });

  test('should_send_delete_customer_to_correct_url', async () => {
    const ax = require('axios');
    ax.delete.mockResolvedValue({ data: { success: true } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().deleteCustomer('cust456');

    expect(ax.delete.mock.calls[0][0]).toContain('/customers/cust456');
  });
});

describe('API Contract: My Debts (Customer Side)', () => {
  test('should_fetch_my_debts_with_phone_in_url', async () => {
    useStore.setState({ user: { _id: 'cust1', Phone: '0911000001' } });
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().fetchMyDebts();

    expect(ax.get.mock.calls[0][0]).toContain('/customers/my-debts/0911000001');
  });
});

describe('API Contract: Transactions', () => {
  beforeEach(() => {
    useStore.setState({ user: { _id: 'owner1' } });
  });

  test('should_send_transaction_payload_with_correct_json_keys', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { _id: 'tx1' } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().addTransaction({
      customerId: 'cust1', type: 'GAVE', amount: 300, description: 'Sugar'
    });

    const [url, payload] = ax.post.mock.calls[0];
    expect(url).toContain('/transactions');
    expect(payload).toEqual({ customerId: 'cust1', type: 'GAVE', amount: 300, description: 'Sugar' });
    expect(typeof payload.amount).toBe('number');
    expect(['GAVE', 'GOT']).toContain(payload.type);
  });

  test('should_send_settle_all_payload_with_customerId', async () => {
    const ax = require('axios');
    ax.post.mockResolvedValue({ data: { settledAmount: 500 } });
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().settleAll('cust1');

    const [url, payload] = ax.post.mock.calls[0];
    expect(url).toContain('/transactions/settle-all');
    expect(payload).toEqual({ customerId: 'cust1' });
  });

  test('should_fetch_transactions_with_customerId_in_url', async () => {
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: [] });

    await useStore.getState().fetchTransactions('cust789');

    expect(ax.get.mock.calls[0][0]).toContain('/transactions/cust789');
  });
});

describe('API Contract: Reports', () => {
  test('should_fetch_daily_collection_with_ownerId_query_param', async () => {
    useStore.setState({ user: { _id: 'owner1' } });
    const ax = require('axios');
    ax.get.mockResolvedValue({ data: { total: 0 } });

    await useStore.getState().fetchDailyCollection();

    expect(ax.get.mock.calls[0][0]).toContain('/reports/daily-collection?ownerId=owner1');
  });
});

describe('Error Handling States', () => {
  test('should_handle_loading_state_correctly_on_error', async () => {
    const ax = require('axios');
    ax.post.mockRejectedValue(new Error('fail'));

    await useStore.getState().login('0911223344', 'pass', 'Shop_Owner');

    expect(useStore.getState().loading).toBe(false);
    expect(useStore.getState().user).toBeNull();
  });

  test('should_handle_server_down_gracefully_when_fetching_customers', async () => {
    useStore.setState({ user: { _id: 'owner1' }, customers: [{ _id: 'old' }] });
    const ax = require('axios');
    ax.get.mockRejectedValue(new Error('ECONNREFUSED'));

    await useStore.getState().fetchCustomers();

    expect(useStore.getState().customers).toEqual([{ _id: 'old' }]);
  });
});
