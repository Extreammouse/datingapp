import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapPin, MessageCircle, User as UserIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { MapScreen } from '../screens/MapScreen';
import { MatchesListScreen } from '../screens/MatchesListScreen';
import { MyProfileScreen } from '../screens/MyProfileScreen';

export type BottomTabParamList = {
    ExploreMap: undefined;
    ChatList: undefined;
    MyProfile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabLabel,
                tabBarStyle: styles.tabBar,
                tabBarBackground: () => (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                ),
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
            }}
            initialRouteName="ExploreMap"
        >
            <Tab.Screen
                name="ExploreMap"
                component={MapScreen}
                options={{
                    tabBarLabel: 'EXPLORE',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconActive]}>
                            <MapPin
                                size={24}
                                color={focused ? COLORS.primary : color}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="ChatList"
                component={MatchesListScreen}
                options={{
                    tabBarLabel: 'CONNECT',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconActive]}>
                            <MessageCircle
                                size={24}
                                color={focused ? COLORS.primary : color}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        </View>
                    ),
                    tabBarBadgeStyle: { backgroundColor: COLORS.error },
                }}
            />
            <Tab.Screen
                name="MyProfile"
                component={MyProfileScreen}
                options={{
                    tabBarLabel: 'PROFILE',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconActive]}>
                            <UserIcon
                                size={24}
                                color={focused ? COLORS.primary : color}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        </View>
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
        height: Platform.OS === 'ios' ? 90 : 70,
        borderTopWidth: 0,
        elevation: 0,
        backgroundColor: 'transparent',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: Platform.OS === 'ios' ? 0 : 5,
    },
    iconContainer: {
        padding: 5,
    },
    iconActive: {
        transform: [{ scale: 1.1 }],
    },
});

export default BottomTabNavigator;
