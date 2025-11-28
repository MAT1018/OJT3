import React, { useState, useEffect, useCallback } from 'react';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route, navigation }) => {
    const { tripId, myId } = route.params;
    const [messages, setMessages] = useState([]);

    const chatId = [tripId, myId].sort().join('_');

    useEffect(() => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(
                snapshot.docs.map(doc => ({
                    _id: doc.id,
                    createdAt: doc.data().createdAt.toDate(),
                    text: doc.data().text,
                    user: doc.data().user,
                }))
            );
        });

        return () => unsubscribe();
    }, [chatId]);

    const onSend = useCallback((messages = []) => {
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, messages)
        );

        const { _id, createdAt, text, user } = messages[0];
        addDoc(collection(db, 'chats', chatId, 'messages'), {
            _id,
            createdAt,
            text,
            user
        });
    }, [chatId]);

    const renderBubble = (props) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#276EF1', // Uber Blue
                    },
                    left: {
                        backgroundColor: '#f0f0f0',
                    },
                }}
                textStyle={{
                    right: {
                        color: '#fff',
                    },
                    left: {
                        color: '#000',
                    },
                }}
            />
        );
    };

    const renderSend = (props) => {
        return (
            <Send {...props}>
                <View style={styles.sendingContainer}>
                    <Ionicons name="send" size={24} color="#276EF1" />
                </View>
            </Send>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: myId,
                }}
                renderBubble={renderBubble}
                renderSend={renderSend}
                alwaysShowSend
                scrollToBottom
                placeholder="Type a message..."
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    sendingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 10,
    }
});

export default ChatScreen;
