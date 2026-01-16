/**
 * Sam Agent 2.0 Mobile App
 * Government Contracting Advisor for Singh Automation
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

// Screens
import DailyBriefing from './src/screens/DailyBriefing';
import Opportunities from './src/screens/Opportunities';
import OpportunityDetail from './src/screens/OpportunityDetail';
import Chat from './src/screens/Chat';
import Settings from './src/screens/Settings';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  OpportunityDetail: { id: string };
};

export type TabParamList = {
  Briefing: undefined;
  Opportunities: undefined;
  Chat: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Tab icons (using text for simplicity - replace with proper icons)
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
    {name === 'Briefing' && '📋'}
    {name === 'Opportunities' && '🎯'}
    {name === 'Chat' && '💬'}
    {name === 'Settings' && '⚙️'}
  </Text>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a4a',
        },
      })}
    >
      <Tab.Screen
        name="Briefing"
        component={DailyBriefing}
        options={{ title: "Today's Briefing" }}
      />
      <Tab.Screen
        name="Opportunities"
        component={Opportunities}
        options={{ title: 'Opportunities' }}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{ title: 'Ask Sam' }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1a1a2e',
              },
              headerTintColor: '#fff',
            }}
          >
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OpportunityDetail"
              component={OpportunityDetail}
              options={{ title: 'Opportunity Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
