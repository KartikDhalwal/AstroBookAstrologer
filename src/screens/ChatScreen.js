import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    Image,
    Animated,
    Keyboard,
    ImageBackground,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { initSocket, getSocket } from "../services/socket";


import { api_url } from "../config/Constants";

const { width, height } = Dimensions.get("window");


export default function ChatScreen({ route }) {
    const { astrologer: routeAstrologer, userData: routeUser, booking: bookingData } = route?.params || {};

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [userTyping, setUserTyping] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [inputHeight, setInputHeight] = useState(120);

    // ⏳ TIMER STATES
    const [remainingTime, setRemainingTime] = useState("");
    const [chatDisabled, setChatDisabled] = useState(false);
    console.log({ routeUser })
    const userData = routeUser || {
        _id: "user_123",
        customerName: "User",
        image: null,
        status: "online",
    };

    const BASE_URL = 'https://alb-web-assets.s3.ap-south-1.amazonaws.com/';

    const getImageUrl = (path) =>
        path?.startsWith('http') ? path : `${BASE_URL}${path}`;
    let Imguri = getImageUrl(userData.image);
    const astrologerId = routeAstrologer?._id || "";

    const socketRef = useRef(null);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingDotAnim = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        if (!bookingData?.time) return;

        const timeRange = bookingData.time.split("-");
        if (timeRange.length !== 2) return;

        const start = timeRange[0].trim();
        const end = timeRange[1].trim();

        const [endH, endM] = end.split(":").map(Number);

        const endTime = new Date();
        endTime.setHours(endH);
        endTime.setMinutes(endM);
        endTime.setSeconds(0);

        const timer = setInterval(() => {
            const now = new Date();
            const diff = endTime - now;

            if (diff <= 0) {
                setRemainingTime("00:00");
                setChatDisabled(true);
                clearInterval(timer);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setRemainingTime(
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [bookingData]);

    // TYPING ANIMATION
    useEffect(() => {
        console.log({ userTyping })
        if (userTyping) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(typingDotAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(typingDotAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            typingDotAnim.setValue(0);
        }
    }, [userTyping]);

    // LOAD CHAT HISTORY
    const loadChatHistory = async () => {
        try {
            if (!astrologerId || !userData?._id) {
                setLoadingHistory(false);
                return;
            }

            const url = `${api_url}mobile/chat/${userData._id}/${astrologerId}`;
            const response = await axios.get(url);
            const data = response.data;

            if (data && data.success) {
                const formatted = (data.messages || []).map((m) => ({
                    id: m.messageId || m._id || `${Date.now()}`,
                    text: m.text || m.message || "",
                    senderId: m.senderId,
                    receiverId: m.receiverId,
                    timestamp: m.timestamp || m.createdAt,
                    status: m.status || "sent",
                }));
                setMessages(formatted);
                setTimeout(scrollToBottom, 120);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        loadChatHistory();
        initializeSocket();

        return () => {
            const s = getSocket();
            if (!s) return;

            s.off("receive_message_normal", handleReceiveMessage);
            s.off("typing");
            s.off("stopped_typing");
            s.off("message_delivered_normal");
            s.off("message_read_normal");

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };

    }, []);

    // SOCKET INIT
    const initializeSocket = () => {
        if (!astrologerId || !userData?._id) return;

        const s = initSocket({
            userId: astrologerId,
            user_type: "astrologer",
        });

        if (!s.connected) {
            s.connect();
        }

        socketRef.current = s;

        s.emit("join_normal_chat", {
            astrologerId,
            userId: userData._id,
        });

        s.on("receive_message_normal", handleReceiveMessage);

        s.on("typing", (d) => {
            if (d.userId === userData._id) setUserTyping(true);
        });

        s.on("stopped_typing", () => setUserTyping(false));

        s.on("message_delivered_normal", ({ tempId, messageId }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId ? { ...m, id: messageId, status: "delivered" } : m
                )
            );
        });

        s.on("message_read_normal", ({ messageId }) => {
            updateMessageStatus(messageId, "read");
        });
    };


    const handleReceiveMessage = (message) => {
        if (message.senderId === astrologerId) return;
        const formatted = {
            id: message.messageId || message.id,
            text: message.text,
            senderId: message.senderId,
            receiverId: message.receiverId,
            timestamp: message.timestamp || message.createdAt,
            status: message.status || "delivered",
        };

        setMessages(prev => [...prev, formatted]);
        setUserTyping(false);
        scrollToBottom();
    };

    const updateMessageStatus = (id, status) => {
        setMessages(prev =>
            prev.map(m => (m.id === id ? { ...m, status } : m))
        );
    };
    const astrologerMeta = {
        fcmToken: userData?.fcmToken,
        astrologer: JSON.stringify({
            _id: astrologerId,
            astrologerName: routeAstrologer.astrologerName,
            profileImage: userData.image,
        }),
        userData: {
            _id: userData._id,
        },
        time: bookingData.time,
        date: bookingData.date,
        sender: 'astrologer',
    };

    const handleSendMessage = () => {
        if (chatDisabled || !inputText.trim()) return;

        const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const newMessage = {
            tempId,
            text: inputText.trim(),
            senderId: astrologerId,
            receiverId: userData._id,
            timestamp: new Date().toISOString(),
            ...astrologerMeta, // ✅ ALWAYS attached
        };

        // optimistic UI
        setMessages(prev => [
            ...prev,
            {
                ...newMessage,
                id: tempId,
                status: 'sent',
            },
        ]);

        setInputText('');
        scrollToBottom();

        const socket = getSocket();
        if (socket?.connected) {
            socket.emit('send_message_normal', newMessage);
        }
    };



    const handleTyping = (txt) => {
        if (chatDisabled) return; // BLOCK TYPING

        setInputText(txt);

        const s = getSocket();
        if (!chatDisabled && s && s.connected) {
            s.emit("typing", {
                userId: astrologerId,
                astrologerId: userData._id,
            });
        }

        typingTimeoutRef.current && clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (s && s.connected) {
                s.emit("stopped_typing", {
                    userId: astrologerId,
                    astrologerId: userData._id,
                });
            }
        }, 2000);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        let h = d.getHours();
        let m = d.getMinutes();
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        m = m < 10 ? `0${m}` : m;
        return `${h}:${m} ${ampm}`;
    };

    const renderMessage = ({ item, index }) => {
        const isMine = item.senderId === astrologerId;
        return (
            <View
                style={[
                    styles.messageContainer,
                    isMine ? styles.myMessageContainer : styles.theirMessageContainer,
                ]}
            >
                {!isMine && (
                    <Image
                        source={{ uri: Imguri }}
                        style={styles.avatar}
                    />
                )}

                <View
                    style={[
                        styles.messageBubble,
                        isMine ? styles.myMessageBubble : styles.theirMessageBubble,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isMine ? styles.myMessageText : styles.theirMessageText,
                        ]}
                    >
                        {item.text}
                    </Text>
                    <View style={styles.footerRow}>
                        <Text
                            style={[
                                styles.messageTime,
                                isMine ? styles.myMessageTime : styles.theirMessageTime,
                            ]}
                        >
                            {formatTime(item.timestamp)}
                        </Text>
                        {isMine && (
                            <Icon name="check-all" size={16} color="#fff" />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // HEADER
    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    <Image
                        source={{ uri: Imguri }}
                        style={styles.headerAvatar}
                    />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>{userData.name}</Text>

                        {/* 🔥 TIMER ADDED HERE */}
                        {/* <Text style={styles.headerStatus}>
                            {chatDisabled
                                ? "Session Ended"
                                : remainingTime
                                    ? `Ends in ${remainingTime}`
                                    : userTyping
                                        ? "typing..."
                                        : userData.status === "online"
                                            ? "Active now"
                                            : "Offline"}
                        </Text> */}
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7F1D1D" />

            {renderHeader()}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 70}
            >


                <ImageBackground
                    source={require("../assets/logoBlack.png")}
                    style={styles.chatBg}
                    imageStyle={styles.watermark}
                >                    {loadingHistory ? (
                    <ActivityIndicator size="large" color="#db9a4a" />
                ) : (
                    <FlatList
                        data={messages}
                        ref={flatListRef}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        onContentSizeChange={scrollToBottom}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.messagesList,
                            { paddingBottom: 20 },
                        ]}
                    />

                )}
                </ImageBackground>

                {/* INPUT AREA WITH DISABLE LOGIC */}
                + <View style={[styles.inputContainer, { paddingBottom: Platform.OS === "android" ? 8 : 24 }]}>
                    <View style={styles.inputShadow}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputBox}>
                                <TextInput
                                    style={[styles.input, { height: Math.max(35, inputHeight) }]}
                                    placeholder="Type your message..."
                                    placeholderTextColor="#9CA3AF"
                                    value={inputText}
                                    onChangeText={handleTyping}
                                    editable={!chatDisabled}
                                    multiline
                                    scrollEnabled
                                    onContentSizeChange={(e) =>
                                        setInputHeight(
                                            Math.min(120, e.nativeEvent.contentSize.height + 16)
                                        )
                                    }
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!inputText.trim() || chatDisabled) &&
                                    styles.sendButtonDisabled,
                                ]}
                                onPress={handleSendMessage}
                                disabled={!inputText.trim() || chatDisabled}
                            >
                                <Icon name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>


            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FEF7ED" },
    input: {
        fontSize: 15,
        paddingVertical: 8,
        textAlignVertical: "top", // ANDROID FIX
    },
    myMessageTime: {
        color: "rgba(255,255,255,0.75)"
    },
    theirMessageTime: {
        color: "#9CA3AF"
    },
    inputContainer: {
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 24 : 12,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },

    header: {
        backgroundColor: "#7F1D1D",
        paddingTop: Platform.OS === "ios" ? 50 : 15,
        paddingBottom: 16,
        elevation: 8,
    },
    headerContent: { paddingHorizontal: 16 },
    headerLeft: { flexDirection: "row", alignItems: "center" },
    headerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.3)",
    },
    headerInfo: { marginLeft: 14 },
    headerName: { fontSize: 19, fontWeight: "700", color: "#fff" },
    headerStatus: { fontSize: 13, color: "#fff", marginTop: 2 },

    messagesContainer: { flex: 1 },
    messagesList: { paddingHorizontal: 16, paddingVertical: 20 },

    messageContainer: { flexDirection: "row", marginBottom: 10 },
    myMessageContainer: { justifyContent: "flex-end" },
    theirMessageContainer: { justifyContent: "flex-start" },

    avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
    watermark: { opacity: 0.06, resizeMode: "fill" },
    chatBg: { flex: 1 },

    messageBubble: {
        maxWidth: width * 0.72,
        padding: 12,
        borderRadius: 18,
        elevation: 2,
    },
    myMessageBubble: { backgroundColor: "#7F1D1D", borderBottomRightRadius: 4 },
    theirMessageBubble: {
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    messageText: { fontSize: 15 },
    myMessageText: { color: "#fff" },
    theirMessageText: { color: "#333" },

    messageTime: { fontSize: 11, marginTop: 4 },


    inputShadow: { elevation: 4 },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "#F9FAFB",
        borderRadius: 26,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    inputBox: { flex: 1, paddingHorizontal: 14, marginTop: 10 },

    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#7F1D1D",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 4,
        marginBottom: 10
    },
    sendButtonDisabled: { backgroundColor: "#A1A1A1" },
});
