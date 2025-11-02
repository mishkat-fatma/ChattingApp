import { Stack } from 'expo-router';


export default function Layout() {
return (
<Stack>
<Stack.Screen name="index" options={{ title: 'Home' }} />
<Stack.Screen name="login" options={{ title: 'Login' }} />
<Stack.Screen name="signup" options={{ title: 'Signup' }} />
<Stack.Screen name="friends" options={{ title: 'Friends' }} />
<Stack.Screen name="chat" options={{ title: 'Chat' }} />
</Stack>
);
}