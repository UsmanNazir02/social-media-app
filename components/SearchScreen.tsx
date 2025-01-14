import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface User {
    _id: string;
    username: string;
    isFollowing?: boolean;
}

interface Following {
    following: {
        _id: string;
        username: string;
    };
}

export default function SearchScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [following, setFollowing] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        fetchFollowing();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (search.length > 0) {
                fetchUsers();
                setHasSearched(true);
            } else {
                setUsers([]);
                setHasSearched(false);
                setError('');
            }
        }, 500);

        return () => clearTimeout(delaySearch);
    }, [search]);

    const fetchFollowing = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await fetch('http://localhost:5021/api/user/following', {
                headers: {
                    'Authorization': token,
                },
            });

            const data = await response.json();

            if (data.statusCode === 200 && data.data) {
                // Extract following user IDs
                const followingIds = data.data.map((item: Following) => item.following._id);
                setFollowing(followingIds);
            }
        } catch (err) {
            console.error('Error fetching following:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await fetch(
                `http://localhost:5021/api/user?search=${encodeURIComponent(search)}`,
                {
                    headers: {
                        'Authorization': token,
                    },
                }
            );

            const data = await response.json();

            if (data.statusCode === 200 && data.data.users && data.data.users.length > 0) {
                setUsers(data.data.users);
            } else {
                setUsers([]);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setUsers([]);
            setError('No Users Found.');
        } finally {
            setLoading(false);
        }
    };


    const handleFollowToggle = async (userId: string) => {
        try {
            setError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            setUsers(users.map(user => {
                if (user._id === userId) {
                    return { ...user, isFollowing: !user.isFollowing };
                }
                return user;
            }));

            const response = await fetch('http://localhost:5021/api/user/follow-toggle', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ following: userId }),
            });

            const data = await response.json();

            if (data.statusCode !== 200) {
                setUsers(users.map(user => {
                    if (user._id === userId) {
                        return { ...user, isFollowing: !user.isFollowing };
                    }
                    return user;
                }));
                setError(data.message || 'Failed to update follow status');
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
            setUsers(users.map(user => {
                if (user._id === userId) {
                    return { ...user, isFollowing: !user.isFollowing };
                }
                return user;
            }));
            setError('Failed to update follow status. Please try again.');
        }
    };


    // Rest of the code remains the same...
    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.userCard}
            activeOpacity={0.7}
        >
            <View style={styles.userInfo}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.username}>{item.username}</Text>
            </View>
            <TouchableOpacity
                style={[
                    styles.followButton,
                    item.isFollowing ? styles.followingButton : null,
                ]}
                onPress={() => handleFollowToggle(item._id)}
                activeOpacity={0.7}
            >
                <Text style={styles.followButtonText}>
                    {item.isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderEmptyComponent = () => {
        if (!hasSearched) return null;
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={50} color="#666" />
                <Text style={styles.emptyText}>
                    No users found matching "{search}"
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.replace('/home')}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#28a745" />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                        onSubmitEditing={Keyboard.dismiss}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearch('');
                                setUsers([]);
                                setHasSearched(false);
                                setError('');
                            }}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.error}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchUsers}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item._id}
                    style={styles.userList}
                    ListEmptyComponent={renderEmptyComponent}
                    ListFooterComponent={() => loading ? (
                        <ActivityIndicator style={styles.loader} color="#28a745" />
                    ) : null}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D0F0E5',
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginRight: 8,
    },
    clearButton: {
        padding: 4,
    },
    userList: {
        flex: 1,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#D0F2C0',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#28a745',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    followButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 100,
        alignItems: 'center',
    },
    followingButton: {
        backgroundColor: '#dc3545',
    },
    followButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    error: {
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 16,
    },
    retryButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loader: {
        marginVertical: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
    header: {
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
        marginBottom: 8,
    },

});