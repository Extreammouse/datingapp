import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Heart, User, Plus } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { MatchesListScreen } from '../screens/MatchesListScreen';
import { MyProfileScreen } from '../screens/MyProfileScreen';

export type BottomTabParamList = {
    HomeTab: undefined;
    SearchTab: undefined;
    AddTab: undefined;
    MatchesTab: undefined;
    ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom center button component
const CenterButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
    <Pressable style={styles.centerButton} onPress={onPress}>
        <View style={styles.centerButtonInner}>
            <Plus size={28} color={COLORS.background} strokeWidth={3} />
        </View>
    </Pressable>
);

// Empty component for the center tab (we use custom button)
const EmptyScreen = () => null;

export const BottomTabNavigator: React.FC<{ onCenterPress: () => void }> = ({ onCenterPress }) => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.electricMagenta,
                tabBarInactiveTintColor: COLORS.textMuted,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Home
                            size={24}
                            color={focused ? COLORS.electricMagenta : color}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="SearchTab"
                component={MapScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Search
                            size={24}
                            color={focused ? COLORS.electricMagenta : color}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="AddTab"
                component={EmptyScreen}
                options={{
                    tabBarButton: () => <CenterButton onPress={onCenterPress} />,
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        onCenterPress();
                    },
                }}
            />
            <Tab.Screen
                name="MatchesTab"
                component={MatchesListScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Heart
                            size={24}
                            color={focused ? COLORS.electricMagenta : color}
                            fill={focused ? COLORS.electricMagenta : 'transparent'}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={MyProfileScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <User
                            size={24}
                            color={focused ? COLORS.electricMagenta : color}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        paddingTop: 10,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    centerButton: {
        top: -25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.electricMagenta,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.electricMagenta,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default BottomTabNavigator;
