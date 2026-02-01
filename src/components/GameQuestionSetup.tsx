import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GameQuestion, QuestionType } from '../services/GameQuestionService';

interface Props {
    onQuestionsCreated: (questions: Omit<GameQuestion, 'id' | 'createdAt'>[]) => void;
}

export const GameQuestionSetup: React.FC<Props> = ({ onQuestionsCreated }) => {
    const [questions, setQuestions] = useState<Omit<GameQuestion, 'id' | 'createdAt'>[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionType, setQuestionType] = useState<QuestionType>('this_that');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');

    const MINIMUM_QUESTIONS = 20;

    const handleAddQuestion = () => {
        // Validation
        if (!currentQuestion.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }

        if (questionType === 'this_that') {
            if (!option1.trim() || !option2.trim()) {
                Alert.alert('Error', 'Please enter both options for This or That');
                return;
            }
            if (!correctAnswer.trim()) {
                Alert.alert('Error', 'Please select your answer');
                return;
            }
        } else if (!correctAnswer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        const newQuestion: Omit<GameQuestion, 'id' | 'createdAt'> = {
            type: questionType,
            question: currentQuestion.trim(),
            correctAnswer: correctAnswer.trim(),
            ...(questionType === 'this_that' && {
                options: [option1.trim(), option2.trim()] as [string, string],
            }),
        };

        setQuestions([...questions, newQuestion]);

        // Reset form
        setCurrentQuestion('');
        setOption1('');
        setOption2('');
        setCorrectAnswer('');

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleFinish = () => {
        if (questions.length < MINIMUM_QUESTIONS) {
            Alert.alert(
                'Need More Questions',
                `You have ${questions.length}/${MINIMUM_QUESTIONS} questions. Please add ${MINIMUM_QUESTIONS - questions.length} more.`
            );
            return;
        }

        onQuestionsCreated(questions);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Game Questions</Text>
            <Text style={styles.subtitle}>
                Others will answer these to collect your fragments. Need at least {MINIMUM_QUESTIONS} questions.
            </Text>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    {questions.length} / {MINIMUM_QUESTIONS} questions
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${Math.min((questions.length / MINIMUM_QUESTIONS) * 100, 100)}%` },
                        ]}
                    />
                </View>
            </View>

            {/* Question Type Selector */}
            <View style={styles.typeSelector}>
                {(['this_that', 'true_false', 'truth_dare'] as QuestionType[]).map((type) => (
                    <Pressable
                        key={type}
                        style={[
                            styles.typeButton,
                            questionType === type && styles.typeButtonActive,
                        ]}
                        onPress={() => {
                            setQuestionType(type);
                            setCorrectAnswer('');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Text
                            style={[
                                styles.typeButtonText,
                                questionType === type && styles.typeButtonTextActive,
                            ]}
                        >
                            {type === 'this_that' && 'This or That'}
                            {type === 'true_false' && 'True/False'}
                            {type === 'truth_dare' && 'Truth/Dare'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Question Input */}
            <TextInput
                style={styles.input}
                placeholder="Enter your question..."
                placeholderTextColor={COLORS.textSecondary}
                value={currentQuestion}
                onChangeText={setCurrentQuestion}
                multiline
            />

            {/* Type-specific inputs */}
            {questionType === 'this_that' && (
                <View style={styles.optionsContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Option 1"
                        placeholderTextColor={COLORS.textSecondary}
                        value={option1}
                        onChangeText={setOption1}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Option 2"
                        placeholderTextColor={COLORS.textSecondary}
                        value={option2}
                        onChangeText={setOption2}
                    />

                    <Text style={styles.label}>Your Answer:</Text>
                    <View style={styles.answerButtons}>
                        <Pressable
                            style={[
                                styles.answerButton,
                                correctAnswer === option1 && styles.answerButtonSelected,
                            ]}
                            onPress={() => setCorrectAnswer(option1)}
                        >
                            <Text style={styles.answerButtonText}>{option1 || 'Option 1'}</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.answerButton,
                                correctAnswer === option2 && styles.answerButtonSelected,
                            ]}
                            onPress={() => setCorrectAnswer(option2)}
                        >
                            <Text style={styles.answerButtonText}>{option2 || 'Option 2'}</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {questionType === 'true_false' && (
                <View style={styles.optionsContainer}>
                    <Text style={styles.label}>Correct Answer:</Text>
                    <View style={styles.answerButtons}>
                        <Pressable
                            style={[
                                styles.answerButton,
                                correctAnswer === 'true' && styles.answerButtonSelected,
                            ]}
                            onPress={() => setCorrectAnswer('true')}
                        >
                            <Text style={styles.answerButtonText}>True</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.answerButton,
                                correctAnswer === 'false' && styles.answerButtonSelected,
                            ]}
                            onPress={() => setCorrectAnswer('false')}
                        >
                            <Text style={styles.answerButtonText}>False</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {questionType === 'truth_dare' && (
                <TextInput
                    style={styles.input}
                    placeholder="Your answer/commitment..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={correctAnswer}
                    onChangeText={setCorrectAnswer}
                    multiline
                />
            )}

            {/* Add Question Button */}
            <Pressable style={styles.addButton} onPress={handleAddQuestion}>
                <Text style={styles.addButtonText}>+ Add Question</Text>
            </Pressable>

            {/* Questions List */}
            <ScrollView style={styles.questionsList}>
                {questions.map((q, index) => (
                    <View key={index} style={styles.questionItem}>
                        <View style={styles.questionItemContent}>
                            <Text style={styles.questionItemType}>
                                {q.type === 'this_that' && '🔀 This or That'}
                                {q.type === 'true_false' && '✓ True/False'}
                                {q.type === 'truth_dare' && '🎭 Truth/Dare'}
                            </Text>
                            <Text style={styles.questionItemText}>{q.question}</Text>
                            <Text style={styles.questionItemAnswer}>Answer: {q.correctAnswer}</Text>
                        </View>
                        <Pressable
                            style={styles.removeButton}
                            onPress={() => handleRemoveQuestion(index)}
                        >
                            <Text style={styles.removeButtonText}>✕</Text>
                        </Pressable>
                    </View>
                ))}
            </ScrollView>

            {/* Finish Button */}
            <Pressable
                style={[
                    styles.finishButton,
                    questions.length < MINIMUM_QUESTIONS && styles.finishButtonDisabled,
                ]}
                onPress={handleFinish}
                disabled={questions.length < MINIMUM_QUESTIONS}
            >
                <Text style={styles.finishButtonText}>
                    {questions.length >= MINIMUM_QUESTIONS ? 'Continue' : `Need ${MINIMUM_QUESTIONS - questions.length} More`}
                </Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
        lineHeight: 20,
    },
    progressContainer: {
        marginBottom: SPACING.xl,
    },
    progressText: {
        fontSize: 14,
        color: COLORS.neonCyan,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    progressBar: {
        height: 6,
        backgroundColor: COLORS.surface,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    typeButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: COLORS.neonCyan,
        backgroundColor: COLORS.surfaceLight,
    },
    typeButtonText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
    },
    typeButtonTextActive: {
        color: COLORS.neonCyan,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        minHeight: 50,
    },
    optionsContainer: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    answerButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    answerButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    answerButtonSelected: {
        borderColor: COLORS.neonCyan,
        backgroundColor: COLORS.surfaceLight,
    },
    answerButtonText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        textAlign: 'center',
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    addButtonText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    questionsList: {
        flex: 1,
        marginBottom: SPACING.lg,
    },
    questionItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    questionItemContent: {
        flex: 1,
    },
    questionItemType: {
        fontSize: 12,
        color: COLORS.neonCyan,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    questionItemText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    questionItemAnswer: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    removeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
    finishButton: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
    },
    finishButtonDisabled: {
        opacity: 0.5,
    },
    finishButtonText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
});
