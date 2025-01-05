import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Post {
    _id: string;
    title: string;
    text: string;
    media: string | null;
    createdAt: string;
}

export default function Home() {
    const [modalVisible, setModalVisible] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        text: '',
        media: null as any,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        checkTokenAndFetchPosts();
    }, []);

    const checkTokenAndFetchPosts = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/');
                return;
            }
            await fetchPosts(token);
        } catch (err) {
            console.error('Error:', err);
            router.replace('/');
        }
    };

    const fetchPosts = async (token: string) => {
        try {
            const response = await fetch('http://localhost:5021/api/post/get', {
                headers: {
                    'Authorization': token,
                },
            });

            const data = await response.json();

            if (data.statusCode === 200) {
                setPosts(data.data);
            } else if (data.statusCode === 401) {
                await AsyncStorage.removeItem('userToken');
                router.replace('/');
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setFormData({ ...formData, media: result.assets[0] });
        }
    };

    const handleCreatePost = async () => {
        try {
            if (!formData.title || !formData.text) {
                setError('Title and text are required');
                return;
            }

            setLoading(true);
            setError('');

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/');
                return;
            }

            // Create FormData object
            const form = new FormData();

            // Append text fields
            form.append('title', formData.title.trim());
            form.append('text', formData.text.trim());

            // Handle image if present
            if (formData.media) {
                const localUri = formData.media.uri;
                const filename = localUri.split('/').pop() || 'image.jpg';

                // Infer the MIME type from the file extension
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

                // Create a Blob from the file URI if needed
                const response = await fetch(localUri);
                const blob = await response.blob();

                // Append the file with the correct structure
                form.append('media', {
                    uri: localUri,
                    type: type,
                    name: filename,
                    size: blob.size,
                } as any);
            }

            console.log('Sending form data:', {
                title: formData.title,
                text: formData.text,
                media: formData.media ? 'present' : 'none'
            });

            const response = await fetch('http://localhost:5021/api/post/create', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json',
                },
                body: form,
            });

            const data = await response.json();
            console.log('Create post response:', data);

            if (data.statusCode === 200) {
                setModalVisible(false);
                setFormData({ title: '', text: '', media: null });
                await fetchPosts(token);
            } else if (data.statusCode === 401) {
                await AsyncStorage.removeItem('userToken');
                router.replace('/');
            } else {
                setError(data.message || 'Failed to create post');
            }
        } catch (err) {
            console.error('Error creating post:', err);
            setError('An error occurred while creating the post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Posts</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.postsContainer}>
                {posts.map((post) => (
                    <View key={post._id} style={styles.postCard}>
                        <Text style={styles.postTitle}>{post.title}</Text>
                        <Text style={styles.postText}>{post.text}</Text>
                        {post.media && (
                            <Image
                                source={{ uri: `http://localhost:5021${post.media}` }}
                                style={styles.postImage}
                                resizeMode="cover"
                            />
                        )}
                        <Text style={styles.postDate}>
                            {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Post</Text>

                        {error && <Text style={styles.error}>{error}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={formData.title}
                            onChangeText={(text) => setFormData({ ...formData, title: text })}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What's on your mind?"
                            value={formData.text}
                            onChangeText={(text) => setFormData({ ...formData, text: text })}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                            <Text style={styles.imagePickerText}>
                                {formData.media ? 'Change Image' : 'Add Image'}
                            </Text>
                        </TouchableOpacity>

                        {formData.media && (
                            <Image
                                source={{ uri: formData.media.uri }}
                                style={styles.previewImage}
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setFormData({ title: '', text: '', media: null });
                                    setError('');
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.createButton]}
                                onPress={handleCreatePost}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Create Post</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D0F0E5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#D0F2C0',
        borderBottomWidth: 1,
        borderBottomColor: '#28a745',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#28a745',
    },
    addButton: {
        backgroundColor: '#28a745',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    postsContainer: {
        flex: 1,
        padding: 16,
    },
    postCard: {
        backgroundColor: '#D0F2C0',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    postText: {
        fontSize: 16,
        marginBottom: 8,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    postDate: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#D0F2C0',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#28a745',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: 'white',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    imagePickerButton: {
        backgroundColor: '#32CD32',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    imagePickerText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#dc3545',
    },
    createButton: {
        backgroundColor: '#28a745',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
});