import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Pressable,
    Switch,
    Alert,
} from 'react-native';
import {
    ArrowLeft,
    MapPin,
    Bell,
    Shield,
    Moon,
    LogOut,
    ChevronRight,
    Trash2,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { databaseService } from '../services/DatabaseService';

interface SettingsScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(true); // Always dark for now

    useEffect(() => {
        checkLocationPermission();
    }, []);

    const checkLocationPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationEnabled(status === 'granted');
    };

    const handleLocationToggle = async (value: boolean) => {
        if (value) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationEnabled(status === 'granted');
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable location access in your device settings.',
                    [{ text: 'OK' }]
                );
            }
        } else {
            Alert.alert(
                'Location Required',
                'Location is required to find nearby matches. You can disable it in device settings.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will delete your profile and all matches. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // In production, clear database
                        Alert.alert('Data Cleared', 'All your data has been deleted.');
                        navigation.navigate('ProfileSetup');
                    },
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    onPress: () => {
                        navigation.navigate('ProfileSetup');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Location Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <MapPin size={20} color={COLORS.neonCyan} />
                            <View>
                                <Text style={styles.settingTitle}>Location Access</Text>
                                <Text style={styles.settingSubtitle}>
                                    Required to find nearby matches
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={locationEnabled}
                            onValueChange={handleLocationToggle}
                            trackColor={{ false: COLORS.surfaceLight, true: COLORS.neonCyanDim }}
                            thumbColor={locationEnabled ? COLORS.neonCyan : COLORS.textMuted}
                        />
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Bell size={20} color={COLORS.electricMagenta} />
                            <View>
                                <Text style={styles.settingTitle}>Push Notifications</Text>
                                <Text style={styles.settingSubtitle}>
                                    Get notified about matches and messages
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: COLORS.surfaceLight, true: COLORS.electricMagentaDim }}
                            thumbColor={notificationsEnabled ? COLORS.electricMagenta : COLORS.textMuted}
                        />
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Moon size={20} color={COLORS.textSecondary} />
                            <View>
                                <Text style={styles.settingTitle}>Dark Mode</Text>
                                <Text style={styles.settingSubtitle}>Always on (default theme)</Text>
                            </View>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={() => { }}
                            disabled
                            trackColor={{ false: COLORS.surfaceLight, true: COLORS.surfaceLight }}
                            thumbColor={COLORS.textMuted}
                        />
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <Pressable style={styles.settingRow} onPress={() => navigation.navigate('ProfileSetup')}>
                        <View style={styles.settingInfo}>
                            <Shield size={20} color={COLORS.textSecondary} />
                            <Text style={styles.settingTitle}>Edit Profile</Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.textMuted} />
                    </Pressable>

                    <Pressable style={styles.settingRow} onPress={handleClearData}>
                        <View style={styles.settingInfo}>
                            <Trash2 size={20} color={COLORS.error} />
                            <Text style={[styles.settingTitle, { color: COLORS.error }]}>
                                Clear All Data
                            </Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.textMuted} />
                    </Pressable>

                    <Pressable style={styles.settingRow} onPress={handleLogout}>
                        <View style={styles.settingInfo}>
                            <LogOut size={20} color={COLORS.warning} />
                            <Text style={[styles.settingTitle, { color: COLORS.warning }]}>
                                Log Out
                            </Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.textMuted} />
                    </Pressable>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appVersion}>Dating App v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    settingSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    appVersion: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});

export default SettingsScreen;
