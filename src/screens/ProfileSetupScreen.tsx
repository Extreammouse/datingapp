import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
    Camera,
    User,
    Heart,
    Sparkles,
    ChevronRight,
    Plus,
    X,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { databaseService, UserProfile } from '../services/DatabaseService';

interface ProfileSetupScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'>;
}

const DEFAULT_BIO_TAGS = [
    'Hiking', 'Coffee Lover', 'Dog Person', 'Cat Person', 'Foodie',
    'Travel', 'Music', 'Movies', 'Gym', 'Reading', 'Gaming', 'Art',
    'Photography', 'Dancing', 'Cooking', 'Yoga', 'Beach', 'Mountains',
];

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
    const [lookingFor, setLookingFor] = useState<'male' | 'female' | 'everyone' | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const totalSteps = 4;

    const pickImage = async (index: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Needed', 'We need access to your photos to add profile pictures.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newPhotos = [...photos];
            if (index < photos.length) {
                newPhotos[index] = result.assets[0].uri;
            } else {
                newPhotos.push(result.assets[0].uri);
            }
            setPhotos(newPhotos);
        }
    };

    const removePhoto = (index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const toggleTag = (tag: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else if (selectedTags.length < 5) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return name.trim().length >= 2 && age.trim().length > 0 && parseInt(age) >= 18;
            case 2:
                return photos.length >= 1;
            case 3:
                return gender !== null && lookingFor !== null;
            case 4:
                return selectedTags.length >= 1;
            default:
                return false;
        }
    };

    const handleNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            // Save profile
            setIsLoading(true);
            try {
                await databaseService.initialize();

                const profile: UserProfile = {
                    id: `user_${Date.now()}`,
                    name: name.trim(),
                    age: parseInt(age),
                    bio: bio.trim(),
                    photos,
                    bioTags: selectedTags.map((label, i) => ({
                        id: `tag_${i}`,
                        label,
                        revealed: false,
                    })),
                    gender: gender!,
                    lookingFor: lookingFor!,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                await databaseService.saveUserProfile(profile);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.replace('MainTabs');
            } catch (error) {
                console.error('Failed to save profile:', error);
                Alert.alert('Error', 'Failed to save your profile. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
                        <User size={60} color={COLORS.neonCyan} style={styles.stepIcon} />
                        <Text style={styles.stepTitle}>Let's get to know you</Text>
                        <Text style={styles.stepSubtitle}>What's your name?</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Your name"
                            placeholderTextColor={COLORS.textMuted}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />

                        <Text style={[styles.stepSubtitle, { marginTop: SPACING.lg }]}>How old are you?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Age (18+)"
                            placeholderTextColor={COLORS.textMuted}
                            value={age}
                            onChangeText={setAge}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </Animated.View>
                );

            case 2:
                return (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
                        <Camera size={60} color={COLORS.electricMagenta} style={styles.stepIcon} />
                        <Text style={styles.stepTitle}>Add your photos</Text>
                        <Text style={styles.stepSubtitle}>Add at least 1 photo (max 6)</Text>

                        <View style={styles.photosGrid}>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <Pressable
                                    key={index}
                                    style={styles.photoSlot}
                                    onPress={() => pickImage(index)}
                                >
                                    {photos[index] ? (
                                        <View style={styles.photoContainer}>
                                            <Image source={{ uri: photos[index] }} style={styles.photo} />
                                            <Pressable
                                                style={styles.removePhotoButton}
                                                onPress={() => removePhoto(index)}
                                            >
                                                <X size={16} color={COLORS.textPrimary} />
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <View style={styles.emptyPhotoSlot}>
                                            <Plus size={32} color={COLORS.textMuted} />
                                        </View>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>
                );

            case 3:
                return (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
                        <Heart size={60} color={COLORS.electricMagenta} style={styles.stepIcon} />
                        <Text style={styles.stepTitle}>About you</Text>

                        <Text style={styles.optionLabel}>I am a...</Text>
                        <View style={styles.optionsRow}>
                            {(['male', 'female', 'other'] as const).map((option) => (
                                <Pressable
                                    key={option}
                                    style={[styles.optionButton, gender === option && styles.optionButtonSelected]}
                                    onPress={() => setGender(option)}
                                >
                                    <Text style={[styles.optionText, gender === option && styles.optionTextSelected]}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.optionLabel}>Looking for...</Text>
                        <View style={styles.optionsRow}>
                            {(['male', 'female', 'everyone'] as const).map((option) => (
                                <Pressable
                                    key={option}
                                    style={[styles.optionButton, lookingFor === option && styles.optionButtonSelected]}
                                    onPress={() => setLookingFor(option)}
                                >
                                    <Text style={[styles.optionText, lookingFor === option && styles.optionTextSelected]}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={[styles.optionLabel, { marginTop: SPACING.lg }]}>Your bio (optional)</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor={COLORS.textMuted}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            maxLength={200}
                        />
                    </Animated.View>
                );

            case 4:
                return (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
                        <Sparkles size={60} color={COLORS.neonCyan} style={styles.stepIcon} />
                        <Text style={styles.stepTitle}>Your interests</Text>
                        <Text style={styles.stepSubtitle}>Select 1-5 tags that describe you</Text>

                        <View style={styles.tagsContainer}>
                            {DEFAULT_BIO_TAGS.map((tag) => (
                                <Pressable
                                    key={tag}
                                    style={[styles.tagButton, selectedTags.includes(tag) && styles.tagButtonSelected]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                                        {tag}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>
                );

            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderStep()}
            </ScrollView>

            {/* Continue button */}
            <Animated.View entering={FadeInUp.duration(300)} style={styles.footer}>
                <Pressable
                    style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
                    onPress={handleNext}
                    disabled={!canProceed() || isLoading}
                >
                    <Text style={styles.continueButtonText}>
                        {isLoading ? 'Saving...' : step === totalSteps ? 'Get Started' : 'Continue'}
                    </Text>
                    {!isLoading && <ChevronRight size={24} color={COLORS.background} />}
                </Pressable>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    progressContainer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xxl + 20,
        paddingBottom: SPACING.md,
    },
    progressBar: {
        height: 4,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
        borderRadius: 2,
    },
    progressText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    stepContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: SPACING.xl,
    },
    stepIcon: {
        marginBottom: SPACING.lg,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    stepSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: SPACING.md,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.sm,
        width: '100%',
    },
    photoSlot: {
        width: '30%',
        aspectRatio: 3 / 4,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    photoContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyPhotoSlot: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.surfaceLight,
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: 16,
        color: COLORS.textSecondary,
        alignSelf: 'flex-start',
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        width: '100%',
    },
    optionButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surfaceLight,
    },
    optionButtonSelected: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
    },
    optionText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: COLORS.neonCyan,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'center',
        width: '100%',
    },
    tagButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    tagButtonSelected: {
        borderColor: COLORS.electricMagenta,
        backgroundColor: 'rgba(255, 0, 255, 0.1)',
    },
    tagText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    tagTextSelected: {
        color: COLORS.electricMagenta,
        fontWeight: '600',
    },
    footer: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.neonCyan,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    continueButtonDisabled: {
        backgroundColor: COLORS.surfaceLight,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.background,
    },
});

export default ProfileSetupScreen;
