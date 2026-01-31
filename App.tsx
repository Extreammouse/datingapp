import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from './src/constants/theme';
import { RootStackParamList } from './src/types';

// Navigation
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

// Screens
import { TugOfWarScreen } from './src/screens/TugOfWarScreen';
import { SyncGridScreen } from './src/screens/SyncGridScreen';
import { FrequencySyncScreen } from './src/screens/FrequencySyncScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ChatScreenWrapper } from './src/screens/ChatScreenWrapper';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GameSelectionScreen } from './src/screens/GameSelectionScreen';

// Services
import { staminaService } from './src/services/StaminaService';
import { locationService } from './src/services/LocationService';
import { databaseService } from './src/services/DatabaseService';
import { dummyDataService } from './src/services/DummyDataService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Reanimated 2',
  'Non-serializable values',
]);

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom dark theme for navigation
const DatingAppTheme = {
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

// Main Tabs wrapper component
const MainTabsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCenterPress = () => {
    // Navigate to game selection when + button is pressed
    navigation.navigate('GameSelection', { partnerId: 'demo_partner' });
  };

  return <BottomTabNavigator onCenterPress={handleCenterPress} />;
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

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

        // Initialize database
        await databaseService.initialize();
        console.log('[App] Database initialized');

        // Seed dummy users for testing
        await dummyDataService.seedDummyUsers();
        console.log('[App] Dummy users seeded');

        // Check if user has profile
        const profileExists = await databaseService.hasUserProfile();
        setHasProfile(profileExists);
      } catch (error) {
        console.error('[App] Failed to initialize services:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      locationService.stopTracking();
    };
  }, []);

  if (!isReady) {
    return null; // Could show a splash screen here
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      <NavigationContainer theme={DatingAppTheme}>
        <Stack.Navigator
          initialRouteName={hasProfile ? 'MainTabs' : 'ProfileSetup'}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          {/* Profile Setup - First time user onboarding */}
          <Stack.Screen
            name="ProfileSetup"
            component={ProfileSetupScreen}
            options={{
              animation: 'fade',
            }}
          />

          {/* Main Tabs - Bottom tab navigation */}
          <Stack.Screen
            name="MainTabs"
            component={MainTabsScreen}
            options={{
              animation: 'fade',
            }}
          />

          {/* Settings Screen */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
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

          {/* Game Selection */}
          <Stack.Screen
            name="GameSelection"
            component={GameSelectionScreen}
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
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

          {/* Profile Screen (other user's profile) */}
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
