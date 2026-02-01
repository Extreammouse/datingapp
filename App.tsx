import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/theme';
import { RootStackParamList } from './src/types';

// Navigation
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { TugOfWarScreen } from './src/screens/TugOfWarScreen';
import { SyncGridScreen } from './src/screens/SyncGridScreen';
import { FrequencySyncScreen } from './src/screens/FrequencySyncScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ChatScreenWrapper } from './src/screens/ChatScreenWrapper';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GameWrapperScreen } from './src/screens/GameWrapperScreen';
import { GameGauntletScreen } from './src/screens/GameGauntletScreen';

// Services
import { firebaseAuthService } from './src/services/FirebaseAuthService';
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
  return <BottomTabNavigator />;
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Initialize Firebase auth and listen to auth state
    firebaseAuthService.initialize();

    const unsubscribe = firebaseAuthService.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
      console.log('[App] Auth state:', user ? 'Authenticated' : 'Not authenticated');
    });

    return () => unsubscribe();
  }, []);

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

  if (!isReady || !authChecked) {
    return null; // Could show a splash screen here
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
          translucent={false}
        />
        <NavigationContainer theme={DatingAppTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
              contentStyle: {
                backgroundColor: COLORS.background,
              },
            }}
          >
            {!isAuthenticated ? (
              // Auth Stack - Show when NOT authenticated
              <>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{
                    animation: 'fade',
                  }}
                />

                <Stack.Screen
                  name="Signup"
                  component={SignupScreen}
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
              </>
            ) : (
              // App Stack - Show when authenticated
              <>
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

                {/* Game Selection / Wrapper */}
                <Stack.Screen
                  name="GameSelection"
                  component={GameWrapperScreen}
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

                {/* Game Gauntlet */}
                <Stack.Screen
                  name="GameGauntlet"
                  component={GameGauntletScreen}
                  options={{
                    animation: 'fade',
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
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
