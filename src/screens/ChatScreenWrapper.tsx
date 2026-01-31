import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { ChatScreen } from './ChatScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Wrapper component to bridge navigation props to ChatScreen
export const ChatScreenWrapper: React.FC<Props> = ({ route, navigation }) => {
    const { matchId, matchName, matchImage } = route.params;

    return (
        <ChatScreen
            matchId={matchId}
            matchName={matchName}
            matchImage={matchImage}
            currentUserId="current_user_id" // In production, get from auth context
            onBack={() => navigation.goBack()}
        />
    );
};

export default ChatScreenWrapper;
