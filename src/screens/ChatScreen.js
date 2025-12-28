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

import { Alert } from "react-native";

import { api_url } from "../config/Constants";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");


export default function ChatScreen({ route }) {
    const { astrologer: routeAstrologer, userData: routeUser, booking: bookingData } = route?.params || {};
    console.log({bookingData})
    const insets = useSafeAreaInsets();
    const sessionEndedRef = useRef(false);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [userTyping, setUserTyping] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [inputHeight, setInputHeight] = useState(120);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // ⏳ TIMER STATES
    const [remainingTime, setRemainingTime] = useState("");
    const [chatDisabled, setChatDisabled] = useState(false);
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

    const hasScrolledInitially = useRef(false);

    useEffect(() => {
        if (!bookingData?.fromTime || !bookingData?.toTime || !bookingData?.date) {
          console.log("❌ Missing booking time data");
          return;
        }
      
        console.log("⏳ Booking timer started");
      
        const [endH, endM] = bookingData.toTime.split(":").map(Number);
      
        const endTime = new Date(bookingData.date);
        endTime.setHours(endH, endM, 0, 0);
      
        // ⛔ If end time already passed today, end immediately
        if (endTime <= new Date()) {
            setRemainingTime("00:00");
            setChatDisabled(true);
          
            if (!sessionEndedRef.current) {
              sessionEndedRef.current = true;
              Alert.alert(
                "Session Ended",
                "Session timing has ended.",
                [{ text: "OK" }],
                { cancelable: false }
              );
            }
          
            return;
          }
          
      
        const timer = setInterval(() => {
          const now = new Date();
          const diff = endTime - now;
      
          if (diff <= 0) {
            setRemainingTime("00:00");
            setChatDisabled(true);
            clearInterval(timer);
          
            if (!sessionEndedRef.current) {
              sessionEndedRef.current = true;
          
              Alert.alert(
                "Session Ended",
                "Session timing has ended.",
                [{ text: "OK" }],
                { cancelable: false }
              );
            }
          
            return;
          }
          
      
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
      
          setRemainingTime(
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          );
        }, 1000);
      
        return () => clearInterval(timer);
      }, [bookingData?.fromTime, bookingData?.toTime, bookingData?.date]);
      
      

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
                const formatted = (data.messages || [])
                    .map((m) => ({
                        id: m.messageId || m._id || `${Date.now()}`,
                        text: m.text || m.message || "",
                        senderId: m.senderId,
                        receiverId: m.receiverId,
                        timestamp: m.timestamp || m.createdAt,
                        status: m.status || "sent",
                    }))
                    .reverse(); // 👈 IMPORTANT

                setMessages(formatted);
                // setTimeout(() => scrollToBottom(false), 50);
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

        setMessages((prev) => [formatted, ...prev]); // 👈 prepend
        setUserTyping(false);
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
        setMessages((prev) => [
            {
                ...newMessage,
                id: tempId,
                status: "sent",
            },
            ...prev, // 👈 prepend
        ]);


        setInputText('');
        // scrollToBottom();

        const socket = getSocket();
        if (socket?.connected) {
            socket.emit('send_message_normal', newMessage);
        }
    };
    useEffect(() => {
        if (chatDisabled) {
          setInputText("");
        }
      }, [chatDisabled]);
      


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
              <Image source={{ uri: Imguri }} style={styles.headerAvatar} />
      
              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>
                  {userData.customerName || userData.name}
                </Text>
      
                {/* ⏳ ONLY TIME */}
                <Text style={styles.headerStatus}>
                  Ends in {remainingTime || "00:00"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
      
      

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FEF7ED" }} edges={['top', 'bottom']}>
            {/* <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            > */}
            {/* HEADER */}
            {renderHeader()}

            {/* CHAT AREA */}
            <View style={{ flex: 1 }}>
                <ImageBackground
                    source={require("../assets/logoBlack.png")}
                    style={StyleSheet.absoluteFillObject}
                    imageStyle={styles.watermark}
                />

                {loadingHistory ? (
                    <ActivityIndicator size="large" color="#7F1D1D" />
                ) : (
                    <View style={{ flex: 1 }}>

                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            inverted
                            keyExtractor={(item) => item.id}
                            renderItem={renderMessage}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[
                                styles.messagesList,
                                { paddingTop: 20 },
                            ]}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>

                )}
            </View>

            {/* INPUT */}
            <View
                style={[
                    styles.inputContainer,
                    {
                        paddingBottom: Math.max(insets.bottom, 8),
                        marginBottom: keyboardHeight - 40, 
                    },
                ]}
            >
                <View style={styles.inputWrapper}>
                <TextInput
  style={styles.input}
  placeholder={
    chatDisabled ? "Session has been ended" : "Type your message…"
  }
  placeholderTextColor="#9CA3AF"
  value={inputText}
  onChangeText={handleTyping}
  editable={!chatDisabled}
  multiline
/>

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
            {/* </KeyboardAvoidingView> */}
        </SafeAreaView>
    );

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FEF7ED" },

    myMessageTime: {
        color: "rgba(255,255,255,0.75)"
    },
    theirMessageTime: {
        color: "#9CA3AF"
    },
    inputContainer: {
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },

    inputWrapper: {
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "#F9FAFB",
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    input: {
        flex: 1,
        fontSize: 15,
        minHeight: 40,
        maxHeight: 120,
        paddingVertical: 10,
        paddingRight: 10,
        color: "#111827",
        textAlignVertical: "top",
    },


    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#7F1D1D",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 6,
    },

    sendButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },


    header: {
        backgroundColor: "#7F1D1D",
        paddingTop: Platform.OS === "ios" ? 50 : 15,
        paddingBottom: 16,
        elevation: 8,
        marginTop: -30
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
    headerStatus: {
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
        marginTop: 2,
      },
      

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

    inputBox: { flex: 1, paddingHorizontal: 14, marginTop: 10 },

});
