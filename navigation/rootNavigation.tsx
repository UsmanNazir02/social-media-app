// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../components/loginPage';
import Registration from '../components/RegistrationPage';
import ForgotPassword from '../components/ForgotPassword';
import ResetPassword from '../components/ResetPassword';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

const HomeScreen = () => (
    <View>
        <Text>Home</Text>
    </View>
);

export const RootNavigator = () => (
    <Stack.Navigator>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Registration" component={Registration} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />

    </Stack.Navigator>
);