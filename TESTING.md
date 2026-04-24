# 🧪 Testing Guide — Credit Management System

A professional-grade testing suite covering Unit and Integration tests across the full stack.

---

## Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Run all tests
cd server && npm test        # 81 backend tests
cd ../client && npm test     # 40 frontend tests

# 3. Run with coverage reports
cd server && npm run test:coverage
cd ../client && npm run test:coverage
```

---

## Test Summary

| Layer | Tests | Coverage | Time |
|-------|-------|----------|------|
| **Backend** | 81 passing | ~90% statements | ~8s |
| **Frontend** | 40 passing | ~84% statements | ~2s |
| **Total** | **121 tests** | — | ~10s |

---

## Backend Tests (`server/`)

Run with: `cd server && npm test`

### Unit Tests
| File | What it tests |
|------|---------------|
| `__tests__/unit/validation.test.js` | Phone validation & normalization (14 tests) |
| `__tests__/unit/models.test.js` | Mongoose schema validation — required fields, enums, defaults (17 tests) |

### Integration Tests (Mocked DB)
| File | What it tests |
|------|---------------|
| `__tests__/integration/auth.test.js` | Register, Login, Profile, Verify endpoints (16 tests) |
| `__tests__/integration/customers.test.js` | Customer CRUD, aging days, cascade delete (13 tests) |
| `__tests__/integration/transactions.test.js` | Transaction creation, balance updates (6 tests) |
| `__tests__/integration/reports.test.js` | Aging report categorization, daily collection (8 tests) |

### E2E Scenario Test
| File | What it tests |
|------|---------------|
| `__tests__/e2e/full-scenario.test.js` | Full lifecycle: Register → Login → Customer → Transaction → Reports (7 tests) |

> All integration tests use **mocked Mongoose models** (no database required). Tests run offline and complete in seconds.

---

## Frontend Tests (`client/`)

Run with: `cd client && npm test`

### Unit Tests
| File | What it tests |
|------|---------------|
| `__tests__/unit/store.test.js` | Zustand store actions: login, register, CRUD, loading/error states (18 tests) |
| `__tests__/unit/validation.test.js` | Ethiopian phone validation edge cases (10 tests) |

### Integration Tests
| File | What it tests |
|------|---------------|
| `__tests__/integration/api-contract.test.js` | Verifies JSON keys, data types, URLs match backend API (12 tests) |

> Frontend tests mock `axios` and `react-native`. No server or device needed.

---

## Viewing Coverage Reports

After running `npm run test:coverage`, open the HTML report:

```bash
# Windows
start server\coverage\lcov-report\index.html
start client\coverage\lcov-report\index.html
```

---

## Test Conventions

- **Pattern**: All tests follow `should_..._when_...` naming
- **Structure**: AAA (Arrange-Act-Assert) in every test
- **Isolation**: `beforeEach` / `jest.clearAllMocks()` for clean state
- **Mocking**: Axios mocked for frontend, Mongoose models mocked for backend

---

## Architecture

```
server/
├── __tests__/
│   ├── helpers/mockDb.js    ← Mock Mongoose query/document helpers
│   ├── unit/                ← Schema & validation tests
│   ├── integration/         ← API endpoint tests (mocked DB)
│   └── e2e/                 ← Full lifecycle scenario
└── jest.config.js

client/
├── __mocks__/react-native.js  ← RN module mock
├── __tests__/
│   ├── unit/                   ← Store & validation tests
│   └── integration/            ← API contract verification
└── jest.config.js
```
