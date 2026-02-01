import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Image, Pressable } from 'react-native';
import { ArrowLeft, Camera, Edit3, Settings } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { databaseService, UserProfile } from '../services/DatabaseService';

interface MyProfileScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MyProfile'>;
}

export const MyProfileScreen: React.FC<MyProfileScreenProps> = ({ navigation }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            await databaseService.initialize();
            const userProfile = await databaseService.getUserProfile();
            setProfile(userProfile);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        // Navigate to profile setup to edit
        navigation.navigate('ProfileSetup', { isEditing: true });
    };

    const handleSettings = () => {
        navigation.navigate('Settings');
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.noProfileContainer}>
                    <Text style={styles.noProfileText}>No profile set up yet</Text>
                    <Pressable style={styles.setupButton} onPress={handleEditProfile}>
                        <Text style={styles.setupButtonText}>Set Up Profile</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>My Profile</Text>
                <Pressable onPress={handleEditProfile} style={styles.editButton}>
                    <Edit3 size={20} color={COLORS.neonCyan} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Photos */}
                <View style={styles.photosSection}>
                    {profile.photos.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {profile.photos.map((photo, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: photo }}
                                    style={styles.photo}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.noPhotosContainer}>
                            <Camera size={40} color={COLORS.textMuted} />
                            <Text style={styles.noPhotosText}>No photos added</Text>
                        </View>
                    )}
                </View>

                {/* Basic Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
                </View>

                {/* Details */}
                <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Gender</Text>
                        <Text style={styles.detailValue}>{profile.gender}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Looking For</Text>
                        <Text style={styles.detailValue}>{profile.lookingFor}</Text>
                    </View>
                </View>

                {/* Bio Tags */}
                {profile.bioTags.length > 0 && (
                    <View style={styles.tagsSection}>
                        <Text style={styles.sectionTitle}>About Me</Text>
                        <View style={styles.tagsContainer}>
                            {profile.bioTags.map((tag) => (
                                <View key={tag.id} style={styles.tag}>
                                    {tag.icon && <Text style={styles.tagIcon}>{tag.icon}</Text>}
                                    <Text style={styles.tagLabel}>{tag.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Settings Button */}
                <Pressable style={styles.settingsButton} onPress={handleSettings}>
                    <Settings size={20} color={COLORS.textSecondary} />
                    <Text style={styles.settingsButtonText}>Settings</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
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
    editButton: {
        padding: SPACING.sm,
    },
    placeholder: {
        width: 40,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 100, // Account for tab bar
    },
    photosSection: {
        marginBottom: SPACING.xl,
    },
    photo: {
        width: 200,
        height: 250,
        borderRadius: BORDER_RADIUS.lg,
        marginRight: SPACING.md,
    },
    noPhotosContainer: {
        height: 200,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    noPhotosText: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    infoSection: {
        marginBottom: SPACING.xl,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    bio: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    detailsSection: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        textTransform: 'capitalize',
    },
    tagsSection: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.neonCyanDim,
    },
    tagIcon: {
        fontSize: 14,
    },
    tagLabel: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    noProfileContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.lg,
    },
    noProfileText: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
    setupButton: {
        backgroundColor: COLORS.neonCyan,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
    },
    setupButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '600',
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.lg,
    },
    settingsButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});

export default MyProfileScreen;
