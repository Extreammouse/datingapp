#!/usr/bin/env python3
"""
Add GamePickerModal and game selection to ChatScreen
"""
import re

with open('src/screens/ChatScreen.tsx', 'r') as f:
    content = f.read()

# Find the spot right before the closing KeyboardAvoidingView (before </KeyboardAvoidingView>)
# We'll add the GamePickerModal there

game_picker_modal = '''
                {/* Game Picker Modal */}
                <GamePickerModal
                    visible={showGamePicker}
                    onClose={() => setShowGamePicker(false)}
                    matchName={matchName}
                    onSelectGame={(gameName) => {
                        setMessages((prev) => [...prev, {
                            id: `game_${Date.now()}`,
                            text: `Let's play ${gameName}!`,
                            senderId: currentUserId,
                            timestamp: Date.now(),
                            type: 'game_invitation',
                            gameName: gameName,
                        }]);
                    }}
                />
'''

# Find the last </KeyboardAvoidingView> and insert before it
insert_pattern = r'(\s*)</KeyboardAvoidingView>\s*</SafeAreaView>'
if re.search(insert_pattern, content):
    content = re.sub(insert_pattern, game_picker_modal + r'\n\1</KeyboardAvoidingView>\n</SafeAreaView>', content)
    print("✓ Added GamePickerModal component")
else:
    print("✗ Could not find insertion point for GamePickerModal")

# Update the game toggle button (Sparkles icon press handler)
# Find: onPress={() => setShowReactions(!showReactions)}
# Replace with game toggle logic
old_sparkles_pattern = r'(<Pressable\s+style={styles\.gameToggle}\s+onPress={\(\) => )setShowReactions\(!showReactions\)(})'
new_sparkles_handler = r'\1setShowGamePicker(true)\2'

if re.search(old_sparkles_pattern, content):
    content = re.sub(old_sparkles_pattern, new_sparkles_handler, content)
    print("✓ Updated Sparkles button to open game picker")
else:
    print("✗ Could not find Sparkles button pattern")

with open('src/screens/ChatScreen.tsx', 'w') as f:
    f.write(content)

print("\n✅ GamePickerModal integration complete!")
