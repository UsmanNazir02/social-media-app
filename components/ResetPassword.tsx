import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const VerifyOtp = () => {
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const API_BASE_URL = 'http://localhost:5021/api/auth'; // Added /auth prefix

    const handleResetPassword = async () => {
        setError('');
        if (!otp || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Step 1: Verify the OTP
            const verifyResponse = await fetch(`${API_BASE_URL}/otp/verify-code`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: otp }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.status !== 200 || !verifyData.data?.accessToken) {
                setError(verifyData.message || 'Invalid OTP');
                return;
            }

            // Step 2: Reset the password
            const resetResponse = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${verifyData.data.accessToken}`,
                },
                body: JSON.stringify({
                    newPassword: password,
                    confirmPassword,
                }),
            });

            const resetData = await resetResponse.json();

            if (resetResponse.status === 200 && resetData.statusCode === 200) {
                router.push('/');
                Alert.alert(
                    'Success',
                    resetData.message || 'Password reset successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => {

                            }
                        },
                    ]
                );
            } else {
                setError(resetData.message || 'Password reset failed');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred while resetting the password');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Reset Password</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                    <Text style={styles.buttonText}>Reset Password</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D0F0E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#D0F3B7',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 15 },
    button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' },
    error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});

export default VerifyOtp;