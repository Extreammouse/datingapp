#!/usr/bin/env python3
"""
Script to apply all ChatScreen changes at once
"""
import re

# Read the file
with open('src/screens/ChatScreen.tsx', 'r') as f:
    content = f.read()

# 1. Update MessageBubble to include onGamePress and game_invitation handling
message_bubble_old = r'const MessageBubble: React\.FC<\{[^}]+\}> = \(\{ message, isOwn, showAvatar, matchImage \}\) => \{'
message_bubble_new = '''const MessageBubble: React.FC<{
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    matchImage?: string;
    onGamePress?: (gameName: string) => void;
}> = ({ message, isOwn, showAvatar, matchImage, onGamePress }) => {'''

if re.search(message_bubble_old, content):
    content = re.sub(message_bubble_old, message_bubble_new, content)
    print("✓ Updated MessageBubble signature")
else:
    print("✗ Could not find MessageBubble signature")

# 2. Add game_invitation handler before the final return
game_invitation_code = '''
    if (message.type === 'game_invitation' && message.gameName) {
        return (
            <Animated.View
                entering={FadeInDown.duration(300).springify()}
                style={[styles.messageRow, isOwn && styles.messageRowOwn]}
            >
                {!isOwn && showAvatar && (
                    <View style={styles.avatarContainer}>
                        {matchImage ? (
                            <Image source={{ uri: matchImage }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Heart size={12} color={COLORS.electricMagenta} />
                            </View>
                        )}
                    </View>
                )}
                {!isOwn && !showAvatar && <View style={styles.avatarSpacer} />}
                
                <GameInvitationCard
                    gameName={message.gameName}
                    onPress={() => onGamePress?.(message.gameName!)}
                />
            </Animated.View>
        );
    }
'''

# Insert before the final return statement in MessageBubble
insert_pos = content.find('    return (\n        <Animated.View\n            entering={FadeInDown.duration(200).springify()}')
if insert_pos > 0:
    content = content[:insert_pos] + game_invitation_code + '\n' + content[insert_pos:]
    print("✓ Added game_invitation handling")
else:
    print("✗ Could not find insertion point for game_invitation")

# Write the updated content
with open('src/screens/ChatScreen.tsx', 'w') as f:
    f.write(content)

print("\n✅ MessageBubble updates applied!")
