import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from './src/constants/theme';
import { RootStackParamList } from './src/types';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { TugOfWarScreen } from './src/screens/TugOfWarScreen';
import { SyncGridScreen } from './src/screens/SyncGridScreen';
import { FrequencySyncScreen } from './src/screens/FrequencySyncScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MatchesListScreen } from './src/screens/MatchesListScreen';
import { ChatScreenWrapper } from './src/screens/ChatScreenWrapper';

// Services
import { staminaService } from './src/services/StaminaService';
import { locationService } from './src/services/LocationService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Reanimated 2',
  'Non-serializable values',
]);

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom dark theme for navigation
const ResonanceTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.neonCyan,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.surfaceLight,
    notification: COLORS.electricMagenta,
  },
};

export default function App() {
  useEffect(() => {
    // Initialize services on app start
    const initializeServices = async () => {
      try {
        // Initialize stamina tracking
        await staminaService.initialize();
        console.log('[App] Stamina service initialized');

        // Initialize location service for geofencing
        await locationService.initialize();
        console.log('[App] Location service initialized');
      } catch (error) {
        console.error('[App] Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      locationService.stopTracking();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      <NavigationContainer theme={ResonanceTheme}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          {/* Home Screen - Huddle Stack */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              animation: 'fade',
            }}
          />

          {/* Matches List - Chat with matches */}
          <Stack.Screen
            name="MatchesList"
            component={MatchesListScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />

          {/* Chat Screen */}
          <Stack.Screen
            name="Chat"
            component={ChatScreenWrapper}
            options={{
              animation: 'slide_from_right',
            }}
          />

          {/* Game Screens */}
          <Stack.Screen
            name="TugOfWar"
            component={TugOfWarScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureEnabled: false, // Prevent accidental back during game
            }}
          />

          <Stack.Screen
            name="SyncGrid"
            component={SyncGridScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />

          <Stack.Screen
            name="FrequencySync"
            component={FrequencySyncScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />

          {/* Profile Screen */}
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              animation: 'fade_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

