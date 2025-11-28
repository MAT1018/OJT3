import React, { useState, useEffect, useCallback } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { View, ActivityIndicator } from 'react-native';

const ChatScreen = ({ route }) => {
    const { tripId, myId } = route.params;
    const [messages, setMessages] = useState([]);

    // Create a unique chat ID based on the two trip IDs (sorted to ensure consistency)
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

    return (
        <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{
                _id: myId, // Use my trip ID as user ID
            }}
        />
    );
};

export default ChatScreen;
