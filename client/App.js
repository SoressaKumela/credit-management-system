import React, { useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from './store/useStore';

import RoleSelection from './screens/RoleSelection';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Ledger from './screens/Ledger';
import TransactionForm from './screens/TransactionForm';
import Reminders from './screens/Reminders';
import NewCustomer from './screens/NewCustomer';
import EditCustomer from './screens/EditCustomer';
import CustomerInterface from './screens/CustomerInterface';
import Profile from './screens/Profile';
import Disputes from './screens/Disputes';
import CustomDrawer from './components/CustomDrawer';

const Stack = createNativeStackNavigator();

export default function App() {
  const user = useStore((state) => state.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigationRef = useRef(null);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="RoleSelection" component={RoleSelection} />
              <Stack.Screen name="Auth" component={Login} />
            </>
          ) : user.Role === 'Shop_Owner' ? (
            <>
              <Stack.Screen name="Dashboard">
                {(props) => <Dashboard {...props} onOpenDrawer={() => setDrawerOpen(true)} />}
              </Stack.Screen>
              <Stack.Screen name="Ledger" component={Ledger} />
              <Stack.Screen name="TransactionForm" component={TransactionForm} />
              <Stack.Screen name="Reminders" component={Reminders} />
              <Stack.Screen name="NewCustomer" component={NewCustomer} />
              <Stack.Screen name="EditCustomer" component={EditCustomer} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="Disputes" component={Disputes} />
            </>
          ) : (
            <Stack.Screen name="CustomerInterface" component={CustomerInterface} />
          )}
        </Stack.Navigator>

        {user && user.Role === 'Shop_Owner' && (
          <CustomDrawer
            visible={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            navigation={navigationRef.current}
          />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
