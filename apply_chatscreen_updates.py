#!/usr/bin/env python3
"""
Apply all remaining ChatScreen updates
"""
import re

with open('src/screens/ChatScreen.tsx', 'r') as f:
    lines = f.readlines()

# Find and update state declarations
for i, line in enumerate(lines):
    if "const [showReactions, setShowReactions] = useState(false);" in line:
        lines.insert(i+1, "    const [showGamePicker, setShowGamePicker] = useState(false);\n")
        print("✓ Added showGamePicker state")
        break

# Find ChatScreen component parameters and add navigation
for i, line in enumerate(lines):
    if "matchName," in line and i > 130 and "export const ChatScreen" in ''.join(lines[max(0,i-5):i]):
        # Check if navigation is already there
        next_few = ''.join(lines[i:i+5])
        if "navigation," not in next_few:
            lines.insert(i+3, "    navigation,\n")
            print("✓ Added navigation parameter")
        break

# Find renderMessage and add onGame Press
for i, line in enumerate(lines):
    if "const renderMessage = ({ item, index }: { item: Message; index: number }) => {" in line:
        # Find the MessageBubble component call within renderMessage
        for j in range(i, min(i+20, len(lines))):
            if "matchImage={matchImage}" in lines[j]:
                # Add onGamePress after matchImage
                indent = "                "
                game_press_code = f'''{indent}onGamePress={{(gameName) => {{
{indent}    Haptics.notificationAsync(Haptics.NotificationFeedbackStyle.Success);
{indent}    setMessages((prev) => [...prev, {{
{indent}        id: `status_${{Date.now()}}`,
{indent}        text: `⏳ Waiting for ${{matchName}} to join ${{gameName}}...`,
{indent}        senderId: 'system',
{indent}        timestamp: Date.now(),
{indent}        type: 'system',
{indent}    }}]);
{indent}}}}}
'''
                lines.insert(j+1, game_press_code)
                print("✓ Added onGamePress handler")
                break
        break

# Write back
with open('src/screens/ChatScreen.tsx', 'w') as f:
    f.writelines(lines)

print("\n✅ ChatScreen component updates applied!")
