// AvailabilityStatusScreen.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Switch,
    Alert,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_url } from "../config/Constants";

const API_BASE = "https://your-api-url.com"; // <-- Update API URL

const AvailabilityStatusScreen = () => {
    const [loading, setLoading] = useState(true);

    const [statuses, setStatuses] = useState({
        call: false,
        chat: false,
        videoCall: false,
    });

    // Get status from server
    const fetchStatus = async () => {
        const astrologerData = JSON.parse(await AsyncStorage.getItem("astrologerData"));
        try {
            setLoading(true);
            setStatuses({
                call: astrologerData?.call_status === 'online',
                chat: astrologerData?.chat_status === 'online',
                videoCall: astrologerData?.video_call_status === 'online',
            });
        } catch (error) {
            Alert.alert("Error", "Unable to load availability status.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // Update a specific status
    const updateStatusCall = async (type, value) => {
        const astrologerData = JSON.parse(await AsyncStorage.getItem("astrologerData"));
        setStatuses((prev) => ({ ...prev, [type]: value }));
        try {
            const a = await axios.post(`${api_url}astrologer/change-call-status`, {
                astrologerId: astrologerData?._id,
                call_status: value ? 'online' : 'offline',
            });
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
            setStatuses((prev) => ({ ...prev, [type]: !value })); // revert on fail
        }
    };
    const updateStatusVideoCall = async (type, value) => {
        const astrologerData = JSON.parse(await AsyncStorage.getItem("astrologerData"));
        setStatuses((prev) => ({ ...prev, [type]: value }));
        try {
            await axios.post(`${api_url}astrologer/change-video-call-status`, {
                astrologerId: astrologerData?._id,
                video_call_status: value ? 'online' : 'offline',
            });
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
            setStatuses((prev) => ({ ...prev, [type]: !value })); // revert on fail
        }
    };
    const updateStatusChat = async (type, value) => {
        const astrologerData = JSON.parse(await AsyncStorage.getItem("astrologerData"));
        setStatuses((prev) => ({ ...prev, [type]: value }));
        try {
            await axios.post(`${api_url}astrologer/change-chat-status`, {
                astrologerId: astrologerData?._id,
                chat_status: value ? 'online' : 'offline',
            });

        } catch (error) {
            Alert.alert("Error", "Failed to update status");
            setStatuses((prev) => ({ ...prev, [type]: !value })); // revert on fail
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderWrapper}>
                <ActivityIndicator size="large" color="#f5a623" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Manage Your Availability status</Text>

            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <Icon name="phone" size={30} color="#fff" />
                </View>

                <View style={styles.textBox}>
                    <Text style={styles.title}>Call</Text>
                    <Text style={styles.rate}>₹ 15/min</Text>
                </View>

                <Switch
                    value={statuses.call}
                    onValueChange={(value) => updateStatusCall("call", value)}
                    thumbColor="#fff"
                    trackColor={{ true: "#009432", false: "#d3d3d3" }}
                />
            </View>

            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <Icon name="message-text" size={30} color="#fff" />
                </View>

                <View style={styles.textBox}>
                    <Text style={styles.title}>Chat</Text>
                    <Text style={styles.rate}>₹ 10/min</Text>
                </View>

                <Switch
                    value={statuses.chat}
                    onValueChange={(value) => updateStatusChat("chat", value)}
                    thumbColor="#fff"
                    trackColor={{ true: "#009432", false: "#d3d3d3" }}
                />
            </View>

            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <Icon name="video" size={30} color="#fff" />
                </View>

                <View style={styles.textBox}>
                    <Text style={styles.title}>Video Call</Text>
                    <Text style={styles.rate}>₹ 20/min</Text>
                </View>

                <Switch
                    value={statuses.videoCall}
                    onValueChange={(value) => updateStatusVideoCall("videoCall", value)}
                    thumbColor="#fff"
                    trackColor={{ true: "#009432", false: "#d3d3d3" }}
                />
            </View>

            {/* <View style={styles.keyPointerCard}>
                <View style={styles.leftIconWrapper}>
                    <Icon name="calendar-month-outline" size={32} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title1}>Weekly Time Table</Text>
                    <Text style={styles.title1}>
                        Create a weekly schedule for all your live sessions & make more conversations.
                    </Text>
                </View>
            </View> */}
        </View>
    );
};

export default AvailabilityStatusScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 18,
        backgroundColor: "#fff",
    },
    heading: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 14,
    },
    iconWrap: {
        width: 55,
        height: 55,
        backgroundColor: "#7F1D1D",
        borderRadius: 55,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    textBox: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: "600",
    },
    // textContainer: {
    //     flex: 1,
    // },
    leftIconWrapper: {
        width: 55,
        height: 55,
        backgroundColor: '#f7f1d7',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    title1: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
    },
    rate: {
        fontSize: 14,
        color: "#555",
        marginTop: 4,
    },
    loaderWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    keyPointerCard: {
        backgroundColor: '#7F1D1D',       // same yellow card color as image
        borderRadius: 12,
        padding: 16,
        margin: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});
