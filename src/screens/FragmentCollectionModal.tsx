import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Pressable,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { DroppedFragment } from '../services/FragmentDropService';
import { GameQuestion, gameQuestionService } from '../services/GameQuestionService';

interface Props {
    visible: boolean;
    fragment: DroppedFragment | null;
    onClose: () => void;
    onCollect: (fragmentId: string) => void;
    onFail: (fragmentId: string) => void;
}

export const FragmentCollectionModal: React.FC<Props> = ({
    visible,
    fragment,
    onClose,
    onCollect,
    onFail,
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);

    if (!fragment) return null;

    const questions = fragment.gameQuestions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswer(answer);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleNextQuestion = () => {
        if (!selectedAnswer) return;

        const newAnswers = [...userAnswers, selectedAnswer];
        setUserAnswers(newAnswers);
        setSelectedAnswer('');

        if (isLastQuestion) {
            // Calculate final score
            const result = gameQuestionService.calculateScore(questions, newAnswers);
            setScore(result.score);
            setPassed(result.passed);
            setShowResults(true);

            if (result.passed) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleFinish = () => {
        if (passed) {
            onCollect(fragment.id);
        } else {
            onFail(fragment.id);
        }

        // Reset state
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedAnswer('');
        setShowResults(false);
        onClose();
    };

    const renderQuestion = () => {
        if (!currentQuestion) return null;

        switch (currentQuestion.type) {
            case 'this_that':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>
                        <View style={styles.optionsContainer}>
                            {currentQuestion.options?.map((option, index) => (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        selectedAnswer === option && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => handleAnswerSelect(option)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedAnswer === option && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                );

            case 'true_false':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>
                        <View style={styles.optionsContainer}>
                            {['True', 'False'].map((option) => (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        selectedAnswer === option && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => handleAnswerSelect(option)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedAnswer === option && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                );

            case 'truth_dare':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionTypeLabel}>Truth or Dare</Text>
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>
                        <Pressable
                            style={[styles.optionButton, styles.singleOptionButton]}
                            onPress={() => handleAnswerSelect(currentQuestion.correctAnswer)}
                        >
                            <Text style={styles.optionText}>I'll do it! 💪</Text>
                        </Pressable>
                    </View>
                );

            default:
                return null;
        }
    };

    const renderResults = () => {
        return (
            <View style={styles.resultsContainer}>
                <Image
                    source={{ uri: passed ? fragment.clearImageUrl : fragment.blurredImageUrl }}
                    style={styles.resultImage}
                />

                <Text style={styles.resultTitle}>
                    {passed ? '🎉 Fragment Collected!' : '😔 Fragment Lost'}
                </Text>

                <Text style={styles.scoreText}>
                    Score: {score} / {questions.length}
                </Text>

                <Text style={styles.resultMessage}>
                    {passed
                        ? 'You answered correctly! Fragment added to your collection.'
                        : 'Less than 2 correct answers. The fragment has disappeared.'}
                </Text>

                <Pressable style={styles.finishButton} onPress={handleFinish}>
                    <Text style={styles.finishButtonText}>
                        {passed ? 'Awesome!' : 'Try Again Later'}
                    </Text>
                </Pressable>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {!showResults ? (
                        <>
                            {/* Fragment Preview */}
                            <Image
                                source={{ uri: fragment.blurredImageUrl }}
                                style={styles.fragmentImage}
                            />

                            {/* Progress Indicator */}
                            <Text style={styles.progressText}>
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </Text>

                            {/* Current Question */}
                            <ScrollView style={styles.questionScrollView}>
                                {renderQuestion()}
                            </ScrollView>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                <Pressable style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.nextButton,
                                        !selectedAnswer && styles.nextButtonDisabled,
                                    ]}
                                    onPress={handleNextQuestion}
                                    disabled={!selectedAnswer}
                                >
                                    <Text style={styles.nextButtonText}>
                                        {isLastQuestion ? 'Finish' : 'Next'}
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        renderResults()
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        maxHeight: '90%',
    },
    fragmentImage: {
        width: 120,
        height: 120,
        borderRadius: BORDER_RADIUS.md,
        alignSelf: 'center',
        marginBottom: SPACING.md,
    },
    progressText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    questionScrollView: {
        flex: 1,
    },
    questionContainer: {
        marginBottom: SPACING.xl,
    },
    questionTypeLabel: {
        fontSize: 12,
        color: COLORS.neonCyan,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    questionText: {
        fontSize: 20,
        color: COLORS.textPrimary,
        fontWeight: '600',
        marginBottom: SPACING.lg,
        lineHeight: 28,
    },
    optionsContainer: {
        gap: SPACING.md,
    },
    optionButton: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonSelected: {
        borderColor: COLORS.neonCyan,
        backgroundColor: COLORS.surfaceLight,
    },
    optionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        textAlign: 'center',
        fontWeight: '500',
    },
    optionTextSelected: {
        color: COLORS.neonCyan,
        fontWeight: '600',
    },
    singleOptionButton: {
        backgroundColor: COLORS.neonCyan,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.lg,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 2,
        backgroundColor: COLORS.neonCyan,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    resultsContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    resultImage: {
        width: 200,
        height: 200,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.xl,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    scoreText: {
        fontSize: 18,
        color: COLORS.neonCyan,
        fontWeight: '600',
        marginBottom: SPACING.lg,
    },
    resultMessage: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    finishButton: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl * 2,
    },
    finishButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
