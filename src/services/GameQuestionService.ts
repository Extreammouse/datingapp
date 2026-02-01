import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { firebaseAuthService } from './FirebaseAuthService';

export type QuestionType = 'this_that' | 'truth_dare' | 'true_false';

export interface GameQuestion {
    id?: string;
    type: QuestionType;
    question: string;
    correctAnswer: string;
    options?: [string, string]; // For This or That
    createdAt?: any;
}

class GameQuestionService {
    /**
     * Create a new question for a user
     */
    async createQuestion(question: Omit<GameQuestion, 'id' | 'createdAt'>): Promise<string> {
        try {
            const currentUser = firebaseAuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be authenticated to create questions');
            }

            const questionRef = doc(collection(db, 'users', currentUser.uid, 'gameQuestions'));

            await setDoc(questionRef, {
                ...question,
                createdAt: serverTimestamp(),
            });

            console.log('[GameQuestions] Question created:', questionRef.id);
            return questionRef.id;
        } catch (error: any) {
            console.error('[GameQuestions] Create question error:', error.message);
            throw error;
        }
    }

    /**
     * Get all questions for a user
     */
    async getUserQuestions(userId: string): Promise<GameQuestion[]> {
        try {
            const questionsRef = collection(db, 'users', userId, 'gameQuestions');
            const querySnapshot = await getDocs(questionsRef);

            const questions: GameQuestion[] = [];
            querySnapshot.forEach((doc: any) => {
                questions.push({
                    id: doc.id,
                    ...doc.data(),
                } as GameQuestion);
            });

            return questions;
        } catch (error: any) {
            console.error('[GameQuestions] Get questions error:', error.message);
            throw error;
        }
    }

    /**
     * Get random questions for a fragment (5 questions)
     */
    async getRandomQuestionsForFragment(userId: string, count: number = 5): Promise<GameQuestion[]> {
        try {
            const allQuestions = await this.getUserQuestions(userId);

            if (allQuestions.length < count) {
                throw new Error(`User needs at least ${count} questions. Current: ${allQuestions.length}`);
            }

            // Shuffle and take first 'count' questions
            const shuffled = allQuestions.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        } catch (error: any) {
            console.error('[GameQuestions] Get random questions error:', error.message);
            throw error;
        }
    }

    /**
     * Validate user's answer
     */
    validateAnswer(question: GameQuestion, userAnswer: string): boolean {
        // Case-insensitive comparison, trim whitespace
        const normalized = (str: string) => str.toLowerCase().trim();
        return normalized(userAnswer) === normalized(question.correctAnswer);
    }

    /**
     * Calculate score from answers
     * Returns: { score: number, passed: boolean }
     */
    calculateScore(questions: GameQuestion[], userAnswers: string[]): { score: number; total: number; passed: boolean } {
        let score = 0;

        questions.forEach((question, index) => {
            if (this.validateAnswer(question, userAnswers[index])) {
                score++;
            }
        });

        const total = questions.length;
        const passed = score >= 2; // Need 2/5 to pass

        return { score, total, passed };
    }

    /**
     * Batch create questions (for profile setup)
     */
    async batchCreateQuestions(questions: Omit<GameQuestion, 'id' | 'createdAt'>[]): Promise<void> {
        try {
            const promises = questions.map(q => this.createQuestion(q));
            await Promise.all(promises);
            console.log(`[GameQuestions] Batch created ${questions.length} questions`);
        } catch (error: any) {
            console.error('[GameQuestions] Batch create error:', error.message);
            throw error;
        }
    }
}

// Export singleton
export const gameQuestionService = new GameQuestionService();
export default gameQuestionService;
