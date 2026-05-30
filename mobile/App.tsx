import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { auth } from './services/api';

// We will create these screens next
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import PartiesScreen from './screens/PartiesScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import JournalsScreen from './screens/JournalsScreen';
import SettingsScreen from './screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Parties: undefined;
  Payments: undefined;
  Journals: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await auth.getToken();
      } catch (e) {
        // Restoring token failed
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} initialParams={{ setUserToken }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} initialParams={{ setUserToken }} />
            <Stack.Screen name="Parties" component={PartiesScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="Journals" component={JournalsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
